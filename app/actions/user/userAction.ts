"use server";

import { applyRateLimitMember } from "@/utils/function";
import prisma from "@/utils/prisma";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { createClientServerSide } from "@/utils/supabase/server";
import {
  alliance_earnings_table,
  alliance_notification_table,
} from "@prisma/client";
import { redirect } from "next/navigation";

export const getUserNotification = async () => {
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

    if (!teamMemberProfile) {
      redirect("/");
    }

    const unreadNotification =
      await prisma.alliance_notification_table.findMany({
        where: {
          alliance_notification_user_id: teamMemberProfile?.alliance_member_id,
          alliance_notification_is_read: false,
        },
        take: 10,
        orderBy: {
          alliance_notification_date_created: "desc",
        },
      });

    const userNotification = await prisma.alliance_notification_table.findMany({
      where: {
        alliance_notification_user_id: teamMemberProfile?.alliance_member_id,
        alliance_notification_is_read: true,
      },
      take: 10,
      orderBy: {
        alliance_notification_date_created: "desc",
      },
    });

    const count = await prisma.alliance_notification_table.count({
      where: {
        alliance_notification_user_id: teamMemberProfile?.alliance_member_id,
        alliance_notification_is_read: false,
      },
    });

    return {
      teamMemberProfile,
      unreadNotification: unreadNotification as alliance_notification_table[],
      readNotification: userNotification as alliance_notification_table[],
      count: count,
    };
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch user notification");
  }
};

export const getUnserNotificationWithLimit = async (params: {
  page: number;
  limit: number;
  teamMemberId: string;
  isRead: boolean;
}) => {
  try {
    const { page, limit, teamMemberId, isRead } = params;

    // Apply rate limiting if necessary
    applyRateLimitMember(teamMemberId);

    // Calculate total count
    const count = await prisma.alliance_notification_table.count({
      where: {
        alliance_notification_user_id: teamMemberId,
        alliance_notification_is_read: isRead,
      },
    });

    // Calculate the number of rows remaining
    const remainingRows = count - (page - 1) * limit;

    // Adjust the `take` value to fetch only the remaining rows
    const take = Math.min(limit, remainingRows);

    const userNotification = await prisma.alliance_notification_table.findMany({
      where: {
        alliance_notification_user_id: teamMemberId,
        alliance_notification_is_read: isRead,
      },
      skip: (page - 1) * limit, // Correctly skip rows based on the page
      take, // Dynamically adjust the number of rows to fetch
      orderBy: {
        alliance_notification_date_created: "desc",
      },
    });

    return {
      data: userNotification as alliance_notification_table[],
      count: count, // Total count remains unchanged
    };
  } catch (error) {
    throw new Error("Failed to fetch user notifications");
  }
};

export const convertUnreadToRead = async (params: {
  notificationId: string;
  teamMemberId: string;
}) => {
  try {
    const { notificationId, teamMemberId } = params;

    applyRateLimitMember(teamMemberId);

    const userNotification = await prisma.alliance_notification_table.update({
      where: {
        alliance_notification_id: notificationId,
      },
      data: {
        alliance_notification_is_read: true,
      },
    });

    return userNotification as alliance_notification_table;
  } catch (error) {
    throw new Error("Failed to fetch user notifications");
  }
};

export const getUserEarnings = async (params: { memberId: string }) => {
  try {
    const { memberId } = params;

    await protectionMemberUser(memberId);

    applyRateLimitMember(memberId);

    const user = await prisma.dashboard_earnings_summary.findUnique({
      where: {
        member_id: memberId,
      },
    });

    const userEarnings = await prisma.alliance_earnings_table.findUnique({
      where: {
        alliance_earnings_member_id: memberId,
      },
      select: {
        alliance_olympus_wallet: true,
        alliance_olympus_earnings: true,
        alliance_combined_earnings: true,
        alliance_referral_bounty: true,
      },
    });
    const totalEarnings = {
      directReferralAmount: user?.direct_referral_amount,
      indirectReferralAmount: user?.indirect_referral_amount,
      totalEarnings: user?.total_earnings,
      withdrawalAmount: user?.total_withdrawals,
      directReferralCount: user?.direct_referral_count,
      indirectReferralCount: user?.indirect_referral_count,
    };

    const userEarningsData = {
      ...userEarnings,
    };

    return {
      totalEarnings,
      userEarningsData: userEarningsData as unknown as alliance_earnings_table,
    };
  } catch (error) {
    throw new Error("Failed to fetch user earnings");
  }
};
