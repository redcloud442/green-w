"use server";

import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
import {
  protectionAdminUser,
  protectionMemberUser,
} from "@/utils/serversideProtection";
import { createClientServerSide } from "@/utils/supabase/server";
import { z } from "zod";
const availPackageSchema = z.object({
  amount: z.number().min(1),
  earnings: z.number().min(1),
  packageConnectionId: z.string().uuid(),
  packageName: z.string(),
});

export const claimPackage = async (params: {
  packageConnectionId: string;
  amount: number;
  earnings: number;
  packageName: string;
}) => {
  try {
    const { packageConnectionId, amount, earnings, packageName } = params;

    const parsedData = availPackageSchema.safeParse({
      amount,
      packageConnectionId,
      earnings,
      packageName,
    });

    if (!parsedData.success) {
      throw new Error("Invalid request");
    }

    const { teamMemberProfile } = await protectionMemberUser();
    if (!teamMemberProfile) {
      throw new Error("User authentication failed.");
    }

    const isAllowed = await rateLimit(
      `rate-limit:${teamMemberProfile?.alliance_member_id}`,
      10,
      60
    );

    if (!isAllowed) {
      throw new Error("Too many requests. Please try again later.");
    }

    const packageConnection =
      await prisma.package_member_connection_table.findUnique({
        where: { package_member_connection_id: packageConnectionId },
      });

    if (!packageConnection) {
      throw new Error("Package connection not found.");
    }

    // if (packageConnection.package_member_status !== "ENDED") {
    //   throw new Error("Invalid request");
    // }

    // if (packageConnection.package_member_is_ready_to_claim) {
    //   throw new Error("Invalid request. Package is already claimed.");
    // }

    // if (!packageConnection.package_member_is_ready_to_claim) {
    //   throw new Error("Invalid request. Package is not ready to claim.");
    // }

    console.log(packageConnection);

    const totalClaimedAmount =
      Number(packageConnection.package_member_amount) +
      Number(packageConnection.package_amount_earnings);

    await prisma.$transaction(async (tx) => {
      await tx.package_member_connection_table.update({
        where: { package_member_connection_id: packageConnectionId },
        data: {
          package_member_status: "ENDED",
          package_member_is_ready_to_claim: false,
        },
      });

      await tx.alliance_earnings_table.update({
        where: {
          alliance_earnings_member_id: teamMemberProfile.alliance_member_id,
        },
        data: {
          alliance_olympus_earnings: { increment: totalClaimedAmount },
          alliance_combined_earnings: { increment: totalClaimedAmount },
        },
      });

      await tx.alliance_transaction_table.create({
        data: {
          transaction_member_id: teamMemberProfile.alliance_member_id,
          transaction_amount: totalClaimedAmount,
          transaction_description: `Package Claimed ${packageName}`,
        },
      });

      await tx.package_earnings_log.create({
        data: {
          package_member_connection_id: packageConnectionId,
          package_member_package_id:
            packageConnection.package_member_package_id,
          package_member_member_id: teamMemberProfile.alliance_member_id,
          package_member_connection_created:
            packageConnection.package_member_connection_created,
          package_member_amount: packageConnection.package_member_amount,
          package_member_amount_earnings: earnings,
          package_member_status: "ENDED",
        },
      });
    });

    return { success: true, totalClaimedAmount };
  } catch (error) {
    throw new Error("Internal server error");
  }
};

export const handleBatchPackageNotification = async (page = 1, limit = 100) => {
  try {
    await protectionAdminUser();

    const isAllowed = await rateLimit(
      `rate-limit:admin-batch-package-notification`,
      10,
      60
    );

    if (!isAllowed) {
      throw new Error("Too many requests. Please try again later.");
    }
    const currentDay = new Date().toISOString().split("T")[0];

    const packageNotification = await prisma.package_notification_logs.findMany(
      {
        where: {
          package_notification_logs_date: {
            gte: new Date(`${currentDay}T00:00:00Z`),
            lte: new Date(`${currentDay}T23:59:59Z`),
          },
        },
      }
    );

    if (packageNotification.length > 0) {
      throw new Error("Package notification already sent");
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Format dates for the query
    const startOfTomorrow = new Date(
      `${tomorrow.toISOString().split("T")[0]}T00:00:00Z`
    );
    const endOfTomorrow = new Date(
      `${tomorrow.toISOString().split("T")[0]}T23:59:59Z`
    );

    const packagesWithCompletionDateTomorrow =
      await prisma.package_member_connection_table.findMany({
        where: {
          package_member_status: "ACTIVE",
          package_member_is_notified: false,
          package_member_completion_date: {
            gte: startOfTomorrow,
            lte: endOfTomorrow,
          },
        },
        distinct: ["package_member_member_id"],
        select: {
          package_member_member_id: true,
          package_member_connection_id: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      });

    if (!packagesWithCompletionDateTomorrow.length) {
      return { userCreds: [], totalCount: 0 };
    }

    // Fetch data from alliance_member_table to get teamMemberId
    const allianceMembers = await prisma.alliance_member_table.findMany({
      where: {
        alliance_member_id: {
          in: packagesWithCompletionDateTomorrow.map(
            (item) => item.package_member_member_id
          ),
        },
      },
      select: {
        alliance_member_id: true,
        alliance_member_user_id: true,
      },
    });

    // Fetch user credentials from user_table
    const userCreds = await prisma.user_table.findMany({
      where: {
        user_id: {
          in: allianceMembers.map((item) => item.alliance_member_user_id),
        },
      },
      select: {
        user_email: true,
        user_active_mobile: true,
        user_username: true,
        user_id: true,
      },
    });

    // Combine data from alliance_member_table and user_table with package connections
    const result = packagesWithCompletionDateTomorrow.map((packageItem) => {
      const allianceMember = allianceMembers.find(
        (member) =>
          member.alliance_member_id === packageItem.package_member_member_id
      );
      const user = userCreds.find(
        (user) => user.user_id === allianceMember?.alliance_member_user_id
      );

      return {
        user_email: user?.user_email || null,
        user_active_mobile: user?.user_active_mobile || null,
        user_username: user?.user_username || null,
        team_member_id: allianceMember?.alliance_member_id || null,
        package_connection_id: packageItem.package_member_connection_id,
      };
    });

    const totalCount = await prisma.package_member_connection_table.count({
      where: {
        package_member_status: "ACTIVE",
        package_member_is_notified: false,
        package_member_completion_date: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
        },
      },
    });

    return { userCreds: result, totalCount };
  } catch (error) {
    throw new Error("Internal server error");
  }
};

export const handleUpdateManyPackageMemberConnection = async (
  batchData: {
    packageConnectionId: string;
    teamMemberId: string;
  }[]
) => {
  const supabase = await createClientServerSide();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData) throw new Error("User not found");

  prisma.$transaction(async (tx) => {
    await tx.package_member_connection_table.updateMany({
      where: {
        package_member_connection_id: {
          in: batchData.map((item) => item.packageConnectionId),
        },
      },
      data: { package_member_is_notified: true },
    });

    await tx.alliance_notification_table.createMany({
      data: batchData.map((item) => ({
        alliance_notification_user_id: item.teamMemberId,
        alliance_notification_message:
          "Hello, Do not forget to claim your package tomorrow !",
      })),
    });

    await tx.package_notification_logs.create({});
  });
};
