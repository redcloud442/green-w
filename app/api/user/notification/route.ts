import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
import { createClientServerSide } from "@/utils/supabase/server";
import { alliance_notification_table } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const GET = async (req: NextRequest) => {
  try {
    const supabaseClient = await createClientServerSide();

    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    const user_id = data.user?.id;

    if (error || !data.user) {
      throw error;
    }

    const teamMemberProfile = await prisma.alliance_member_table.findFirst({
      where: {
        alliance_member_user_id: user_id,
      },
    });

    const userNotification = await prisma.alliance_notification_table.findMany({
      where: {
        alliance_notification_user_id: teamMemberProfile?.alliance_member_id,
      },
      take: 10,
      orderBy: {
        alliance_notification_is_read: "asc",
      },
    });

    const count = await prisma.alliance_notification_table.count({
      where: {
        alliance_notification_user_id: teamMemberProfile?.alliance_member_id,
        alliance_notification_is_read: false,
      },
    });

    return NextResponse.json({
      teamMemberProfile,
      userNotification: userNotification,
      count: count,
    });
  } catch (error) {
    throw new Error("Failed to fetch user notification");
  }
};

const getUnserNotificationWithLimitSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1),
  teamMemberId: z.string().uuid(),
});

export const POST = async (req: NextRequest) => {
  try {
    const params = await req.json();

    const validate = getUnserNotificationWithLimitSchema.safeParse(params);

    if (!validate.success) {
      return NextResponse.json({
        error: "Invalid request",
      });
    }

    const { page, limit, teamMemberId } = params;

    const isAllowed = await rateLimit(`rate-limit:${teamMemberId}`, 50, 60);

    if (!isAllowed) {
      return NextResponse.json({
        error: "Too many requests. Please try again later.",
      });
    }

    // Calculate total count
    const count = await prisma.alliance_notification_table.count({
      where: {
        alliance_notification_user_id: teamMemberId,
        alliance_notification_is_read: false,
      },
    });

    const userNotification = await prisma.alliance_notification_table.findMany({
      where: {
        alliance_notification_user_id: teamMemberId,
      },
      skip: (page - 1) * limit,
      take: 10,
      orderBy: [
        { alliance_notification_date_created: "desc" },
        { alliance_notification_is_read: "desc" },
      ],
    });

    return NextResponse.json({
      data: userNotification as alliance_notification_table[],
      count: count, // Total count remains unchanged
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to fetch user notifications",
    });
  }
};
