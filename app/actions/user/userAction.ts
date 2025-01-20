"use server";

import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { createClientServerSide } from "@/utils/supabase/server";
import {
  alliance_earnings_table,
  alliance_notification_table,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

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

    const userNotification = await prisma.alliance_notification_table.findMany({
      where: {
        alliance_notification_user_id: teamMemberProfile?.alliance_member_id,
      },
      take: 10,
      orderBy: {
        alliance_notification_is_read: "asc",
      },
    });

    if (!teamMemberProfile) {
      redirect("/");
    }

    const count = await prisma.alliance_notification_table.count({
      where: {
        alliance_notification_user_id: teamMemberProfile?.alliance_member_id,
        alliance_notification_is_read: false,
      },
    });

    return {
      teamMemberProfile,
      userNotification: userNotification,
      count: count,
    };
  } catch (error) {
    throw new Error("Failed to fetch user notification");
  }
};

export const updateUserNotification = async (teamMemberId: string) => {
  await prisma.alliance_notification_table.updateMany({
    where: {
      alliance_notification_user_id: teamMemberId,
      alliance_notification_is_read: false,
    },
    data: {
      alliance_notification_is_read: true,
    },
  });
};

const getUnserNotificationWithLimitSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1),
  teamMemberId: z.string().uuid(),
  isRead: z.boolean(),
});

export const getUnserNotificationWithLimit = async (params: {
  page: number;
  limit: number;
  teamMemberId: string;
  isRead: boolean;
}) => {
  try {
    const validate = getUnserNotificationWithLimitSchema.safeParse(params);

    if (!validate.success) {
      throw new Error(validate.error.message);
    }

    const { page, limit, teamMemberId } = params;

    const isAllowed = await rateLimit(`rate-limit:${teamMemberId}`, 10, 60);

    if (!isAllowed) {
      throw new Error("Too many requests. Please try again later.");
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
      orderBy: {
        alliance_notification_is_read: "asc",
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

const convertUnreadToReadSchema = z.object({
  notificationId: z.string().uuid(),
  teamMemberId: z.string().uuid(),
});

export const convertUnreadToRead = async (params: {
  notificationId: string;
  teamMemberId: string;
}) => {
  try {
    const validate = convertUnreadToReadSchema.safeParse(params);

    if (!validate.success) {
      throw new Error(validate.error.message);
    }

    const { notificationId, teamMemberId } = params;

    const isAllowed = await rateLimit(`rate-limit:${teamMemberId}`, 10, 60);

    if (!isAllowed) {
      throw new Error("Too many requests. Please try again later.");
    }

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

const getUserEarningsSchema = z.object({
  memberId: z.string().uuid(),
});

export const getUserEarnings = async (params: { memberId: string }) => {
  try {
    const validate = getUserEarningsSchema.safeParse(params);

    if (!validate.success) {
      throw new Error(validate.error.message);
    }

    const { memberId } = params;

    const { teamMemberProfile } = await protectionMemberUser();

    const isAllowed = await rateLimit(
      `rate-limit:${teamMemberProfile?.alliance_member_id}`,
      10,
      60
    );

    if (!isAllowed) {
      throw new Error("Too many requests. Please try again later.");
    }

    const user = await prisma.dashboard_earnings_summary.findUnique({
      where: {
        member_id: memberId,
      },
      select: {
        direct_referral_amount: true,
        indirect_referral_amount: true,
        total_earnings: true,
        total_withdrawals: true,
        package_income: true,
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

    const userRanking = await prisma.alliance_ranking_table.findFirst({
      where: {
        alliance_ranking_member_id: memberId,
      },
      select: {
        alliance_rank: true,
        alliance_total_income_tag: true,
      },
    });

    const totalEarnings = {
      directReferralAmount: user?.direct_referral_amount,
      indirectReferralAmount: user?.indirect_referral_amount,
      totalEarnings: user?.total_earnings,
      withdrawalAmount: user?.total_withdrawals,
      package_income: user?.package_income,
    };

    const userEarningsData = {
      ...userEarnings,
      package_income: user?.package_income,
    };

    return {
      totalEarnings,
      userEarningsData: userEarningsData as unknown as alliance_earnings_table,
      userRanking,
    };
  } catch (error) {
    throw new Error("Failed to fetch user earnings");
  }
};

export const getuserWallet = async (params: { memberId: string }) => {
  try {
    const validate = getUserEarningsSchema.safeParse(params);

    if (!validate.success) {
      throw new Error(validate.error.message);
    }

    const { memberId } = params;

    const { teamMemberProfile } = await protectionMemberUser();

    const isAllowed = await rateLimit(
      `rate-limit:${teamMemberProfile?.alliance_member_id}`,
      10,
      60
    );

    if (!isAllowed) {
      throw new Error("Too many requests. Please try again later.");
    }

    const userEarnings = await prisma.alliance_earnings_table.findUnique({
      where: {
        alliance_earnings_member_id: memberId,
      },
    });

    return {
      userEarningsData: userEarnings as unknown as alliance_earnings_table,
    };
  } catch (error) {
    throw new Error("Failed to fetch user earnings");
  }
};
