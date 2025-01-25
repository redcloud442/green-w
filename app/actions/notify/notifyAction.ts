"use server";
import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
import { createClientServerSide } from "@/utils/supabase/server";
import { ChartDataMember } from "@/utils/types";
import { Prisma } from "@prisma/client";

export const notifyAction = async (params: {
  chartData: ChartDataMember[];
  memberId: string;
}) => {
  try {
    const supabase = await createClientServerSide();

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      throw new Error("User not authenticated");
    }

    const isAllowed = await rateLimit(
      `rate-limit:${authData?.user?.id}`,
      50,
      60
    );

    if (!isAllowed) {
      throw new Error("Too many requests. Please try again later.");
    }

    const { chartData, memberId } = params;

    const notificationData: Prisma.alliance_notification_tableCreateManyInput[] =
      [];
    const packageConnectionIds: string[] = [];

    for (const item of chartData) {
      if (!item.package_connection_id) {
        continue;
      }

      notificationData.push({
        alliance_notification_message: "Package Ready to Claim",
        alliance_notification_user_id: memberId,
      });

      packageConnectionIds.push(item.package_connection_id);
    }

    if (notificationData.length === 0) {
      return;
    }

    if (packageConnectionIds.length === 0) {
      return;
    }

    await prisma.$transaction([
      prisma.alliance_notification_table.createMany({
        data: notificationData,
      }),
      prisma.package_member_connection_table.updateMany({
        where: {
          package_member_connection_id: {
            in: packageConnectionIds,
          },
        },
        data: {
          package_member_is_notified: true,
        },
      }),
    ]);

    return true;
  } catch (err) {
    throw new Error("Error in notifyAction");
  }
};
