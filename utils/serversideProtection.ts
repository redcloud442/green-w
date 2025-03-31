import { logError } from "@/services/Error/ErrorLogs";
import {
  alliance_member_table,
  alliance_referral_link_table,
  user_table,
} from "@prisma/client";
import prisma from "./prisma";
import { createClientServerSide } from "./supabase/server";

export const protectionRegisteredUser = async () => {
  const supabase = await createClientServerSide();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    return { redirect: "/" };
  }
};

export const refreshSession = async () => {
  const supabase = await createClientServerSide();
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    if (error instanceof Error) {
      await logError(supabase, {
        errorMessage: error.message,
        stackTrace: error.stack,
        stackPath: "utils/serversideProtection.ts",
      });
    }
    return false;
  }
  if (data) {
    return true;
  }
};

export const ensureValidSession = async () => {
  const supabase = await createClientServerSide();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }
  if (
    user.user_metadata.expires_at &&
    user.user_metadata.expires_at * 1000 < Date.now() + 60000
  ) {
    return await refreshSession();
  }
  return true;
};

export const protectionAdminUser = async (ip?: string) => {
  try {
    const supabase = await createClientServerSide();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return { redirect: "/login" };
    }

    const userId = authData.user.id;

    // if (ip) {
    //   const banned = await prisma.user_history_log.findFirst({
    //     where: { user_history_user_id: userId, user_ip_address: ip },
    //   });
    //   if (banned) {
    //     return { redirect: "/500" };
    //   }
    // }

    const user = await prisma.user_table.findUnique({
      where: { user_id: userId },
      include: {
        alliance_member_table: {
          include: {
            alliance_referral_link_table: true,
          },
        },
      },
    });

    if (!user) {
      return { redirect: "/login" };
    }

    const validRoles = new Set(["ADMIN"]);
    if (
      !user.alliance_member_table?.[0]?.alliance_member_alliance_id ||
      !validRoles.has(user.alliance_member_table?.[0]?.alliance_member_role) ||
      user.alliance_member_table?.[0]?.alliance_member_restricted
    ) {
      return { redirect: "/login" };
    }

    return {
      profile: user as user_table,
      teamMemberProfile: user
        .alliance_member_table?.[0] as alliance_member_table,
      referral: user.alliance_member_table?.[0]
        ?.alliance_referral_link_table?.[0] as alliance_referral_link_table,
    };
  } catch (error) {
    return { redirect: "/error" };
  }
};

export const protectionMemberUser = async (ip?: string) => {
  const supabase = await createClientServerSide();

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return { redirect: "/login" };
    }

    const userId = authData.user.id;

    const user = await prisma.user_table.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        user_username: true,
        user_first_name: true,
        user_last_name: true,
        user_date_created: true,
        user_profile_picture: true,
        alliance_member_table: {
          select: {
            alliance_member_id: true,
            alliance_member_role: true,
            alliance_member_restricted: true,
            alliance_member_date_created: true,
            alliance_member_date_updated: true,
            alliance_member_is_active: true,
            alliance_referral_link_table: {
              select: {
                alliance_referral_link: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { redirect: "/500" };
    }

    if (
      ![
        "MEMBER",
        "MERCHANT",
        "ACCOUNTING",
        "ADMIN",
        "CLIENT",
        "ACCOUNTING_HEAD",
      ].includes(user.alliance_member_table?.[0]?.alliance_member_role)
    ) {
      return { redirect: "/404" };
    }

    if (user.alliance_member_table?.[0]?.alliance_member_restricted) {
      return { redirect: "/500" };
    }

    return {
      profile: user as unknown as user_table,
      teamMemberProfile: user
        .alliance_member_table?.[0] as unknown as alliance_member_table,
      referral: user.alliance_member_table?.[0]
        ?.alliance_referral_link_table?.[0] as unknown as alliance_referral_link_table,
    };
  } catch (e) {
    if (e instanceof Error) {
      await logError(supabase, {
        errorMessage: e.message,
        stackTrace: e.stack,
        stackPath: "utils/serversideProtection.ts",
      });
    }
    return { redirect: "/500" };
  }
};

export const protectionMerchantUser = async (ip?: string) => {
  const supabase = await createClientServerSide();
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return { redirect: "/login" };
    }

    const userId = authData.user.id;

    // if (ip) {
    //   const banned = await prisma.user_history_log.findFirst({
    //     where: { user_history_user_id: userId, user_ip_address: ip },
    //   });
    //   if (banned) {
    //     return { redirect: "/500" };
    //   }
    // }

    const user = await prisma.user_table.findUnique({
      where: { user_id: userId },
      include: {
        alliance_member_table: {
          include: {
            alliance_referral_link_table: true,
          },
        },
      },
    });
    if (!user) {
      return { redirect: "/login" };
    }

    if (
      !user.alliance_member_table?.[0]?.alliance_member_alliance_id ||
      !["MERCHANT", "ADMIN"].includes(
        user.alliance_member_table?.[0]?.alliance_member_role
      )
    ) {
      return { redirect: "/login" };
    }

    if (user.alliance_member_table?.[0]?.alliance_member_restricted) {
      return { redirect: "/login" };
    }

    return {
      profile: user as user_table,
      teamMemberProfile: user
        .alliance_member_table?.[0] as alliance_member_table,
      referral: user.alliance_member_table?.[0]
        ?.alliance_referral_link_table?.[0] as alliance_referral_link_table,
    };
  } catch (e) {
    if (e instanceof Error) {
      await logError(supabase, {
        errorMessage: e.message,
        stackTrace: e.stack,
        stackPath: "utils/serversideProtection.ts",
      });
    }
    return { redirect: "/login" };
  }
};

export const protectionAccountingUser = async (ip?: string) => {
  const supabase = await createClientServerSide();
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return { redirect: "/login" };
    }

    const userId = authData.user.id;

    // if (ip) {
    //   const banned = await prisma.user_history_log.findFirst({
    //     where: { user_history_user_id: userId, user_ip_address: ip },
    //   });
    //   if (banned) {
    //     return { redirect: "/500" };
    //   }
    // }

    const user = await prisma.user_table.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        user_username: true,
        user_first_name: true,
        user_last_name: true,
        user_date_created: true,
        user_profile_picture: true,
        alliance_member_table: {
          select: {
            alliance_member_id: true,
            alliance_member_role: true,
            alliance_member_restricted: true,
            alliance_member_date_created: true,
            alliance_member_date_updated: true,
            alliance_member_is_active: true,
            alliance_referral_link_table: {
              select: {
                alliance_referral_link: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { redirect: "/login" };
    }

    if (
      !["ADMIN", "ACCOUNTING", "ACCOUNTING_HEAD"].includes(
        user.alliance_member_table?.[0]?.alliance_member_role
      )
    ) {
      return { redirect: "/login" };
    }

    if (user.alliance_member_table?.[0]?.alliance_member_restricted) {
      return { redirect: "/login" };
    }

    return {
      profile: user as unknown as user_table,
      teamMemberProfile: user
        .alliance_member_table?.[0] as unknown as alliance_member_table,
      referral: user.alliance_member_table?.[0]
        ?.alliance_referral_link_table?.[0] as unknown as alliance_referral_link_table,
    };
  } catch (e) {
    if (e instanceof Error) {
      await logError(supabase, {
        errorMessage: e.message,
        stackTrace: e.stack,
        stackPath: "utils/serversideProtection.ts",
      });
    }
    return { redirect: "/login" };
  }
};

export const protectionAllUser = async (ip?: string) => {
  const supabase = await createClientServerSide();
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData) {
      return { redirect: "/login" };
    }

    const userId = authData.user.id;

    const user = await prisma.user_table.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        user_username: true,
        user_first_name: true,
        user_last_name: true,
        user_date_created: true,
        user_profile_picture: true,
        alliance_member_table: {
          select: {
            alliance_member_id: true,
            alliance_member_role: true,
            alliance_member_restricted: true,
            alliance_member_date_created: true,
            alliance_member_date_updated: true,
            alliance_member_is_active: true,
            alliance_referral_link_table: {
              select: {
                alliance_referral_link: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { redirect: "/login" };
    }

    if (
      ![
        "MEMBER",
        "MERCHANT",
        "ACCOUNTING",
        "ADMIN",
        "CLIENT",
        "ACCOUNTING_HEAD",
      ].includes(user.alliance_member_table?.[0]?.alliance_member_role)
    ) {
      return { redirect: "/" };
    }

    if (user.alliance_member_table?.[0]?.alliance_member_restricted) {
      return { redirect: "/login" };
    }

    return {
      profile: user as unknown as user_table,
      teamMemberProfile: user
        .alliance_member_table?.[0] as unknown as alliance_member_table,
      referral: user.alliance_member_table?.[0]
        ?.alliance_referral_link_table?.[0] as unknown as alliance_referral_link_table,
    };
  } catch (e) {
    if (e instanceof Error) {
      await logError(supabase, {
        errorMessage: e.message,
        stackTrace: e.stack,
        stackPath: "utils/serversideProtection.ts",
      });
    }
    return { redirect: "/login" };
  }
};

export const protectionClientMonitoringUser = async (ip?: string) => {
  const supabase = await createClientServerSide();

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return { redirect: "/login" };
    }

    const userId = authData.user.id;

    const user = await prisma.user_table.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        user_username: true,
        user_first_name: true,
        user_last_name: true,
        user_date_created: true,
        user_profile_picture: true,
        alliance_member_table: {
          select: {
            alliance_member_id: true,
            alliance_member_role: true,
            alliance_member_restricted: true,
            alliance_member_date_created: true,
            alliance_member_date_updated: true,
            alliance_member_is_active: true,
            alliance_referral_link_table: {
              select: {
                alliance_referral_link: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { redirect: "/500" };
    }

    if (
      !["CLIENT"].includes(
        user.alliance_member_table?.[0]?.alliance_member_role
      )
    ) {
      return { redirect: "/404" };
    }

    if (user.alliance_member_table?.[0]?.alliance_member_restricted) {
      return { redirect: "/500" };
    }

    return {
      profile: user as unknown as user_table,
      teamMemberProfile: user
        .alliance_member_table?.[0] as unknown as alliance_member_table,
    };
  } catch (e) {
    if (e instanceof Error) {
      await logError(supabase, {
        errorMessage: e.message,
        stackTrace: e.stack,
        stackPath: "utils/serversideProtection.ts",
      });
    }
    return { redirect: "/500" };
  }
};
