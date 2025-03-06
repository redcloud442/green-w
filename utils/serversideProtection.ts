import { logError } from "@/services/Error/ErrorLogs";
import {
  alliance_member_table,
  alliance_referral_link_table,
  chat_session_table,
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

    const [profile, teamMember] = await Promise.all([
      prisma.user_table.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          user_first_name: true,
          user_last_name: true,
          user_profile_picture: true,
          user_username: true,
          user_email: true,
        },
      }),
      prisma.alliance_member_table.findFirst({
        where: { alliance_member_user_id: userId },
        select: {
          alliance_member_id: true,
          alliance_member_role: true,
          alliance_member_alliance_id: true,
          alliance_member_restricted: true,
          alliance_member_is_active: true,
        },
      }),
    ]);

    if (!profile || !teamMember) {
      return { redirect: "/login" };
    }

    const validRoles = new Set(["ADMIN"]);
    if (
      !teamMember.alliance_member_alliance_id ||
      !validRoles.has(teamMember.alliance_member_role) ||
      teamMember.alliance_member_restricted
    ) {
      return { redirect: "/login" };
    }
    const referral = await prisma.alliance_referral_link_table.findFirst({
      where: {
        alliance_referral_link_member_id: teamMember.alliance_member_id,
      },
      select: {
        alliance_referral_link: true,
      },
    });

    if (!referral) {
      return { redirect: "/login" };
    }
    return {
      profile: profile as user_table,
      teamMemberProfile: teamMember as alliance_member_table,
      referral: referral as alliance_referral_link_table,
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

    const [profile, teamMember] = await Promise.all([
      prisma.user_table.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          user_first_name: true,
          user_last_name: true,
          user_profile_picture: true,
          user_username: true,
          user_active_mobile: true,
          user_email: true,
        },
      }),
      prisma.alliance_member_table.findFirst({
        where: { alliance_member_user_id: userId },
        select: {
          alliance_member_id: true,
          alliance_member_is_active: true,
          alliance_member_role: true,
          alliance_member_alliance_id: true,
          alliance_member_restricted: true,
          alliance_member_user_id: true,
        },
      }),
    ]);

    if (!profile) {
      return { redirect: "/500" };
    }

    if (
      !teamMember?.alliance_member_alliance_id ||
      !["MEMBER", "MERCHANT", "ACCOUNTING", "ADMIN", "CLIENT"].includes(
        teamMember.alliance_member_role
      )
    ) {
      return { redirect: "/404" };
    }

    if (teamMember.alliance_member_restricted) {
      return { redirect: "/500" };
    }

    const referal = await prisma.alliance_referral_link_table.findFirst({
      where: {
        alliance_referral_link_member_id: teamMember.alliance_member_id,
      },
      select: {
        alliance_referral_link: true,
      },
    });

    return {
      profile: profile as user_table,
      teamMemberProfile: teamMember as alliance_member_table,
      referal: referal as alliance_referral_link_table,
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

    const [profile, teamMember] = await Promise.all([
      prisma.user_table.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          user_first_name: true,
          user_last_name: true,
          user_profile_picture: true,
          user_username: true,
          user_email: true,
        },
      }),
      prisma.alliance_member_table.findFirst({
        where: { alliance_member_user_id: userId },
        select: {
          alliance_member_id: true,
          alliance_member_role: true,
          alliance_member_alliance_id: true,
          alliance_member_restricted: true,
          alliance_member_is_active: true,
        },
      }),
    ]);

    if (!profile) {
      return { redirect: "/login" };
    }

    if (
      !teamMember?.alliance_member_alliance_id ||
      !["MERCHANT", "ADMIN"].includes(teamMember.alliance_member_role)
    ) {
      return { redirect: "/login" };
    }

    if (teamMember.alliance_member_restricted) {
      return { redirect: "/login" };
    }

    const [referal] = await Promise.all([
      prisma.alliance_referral_link_table.findFirst({
        where: {
          alliance_referral_link_member_id: teamMember.alliance_member_id,
        },
        select: {
          alliance_referral_link: true,
        },
      }),
    ]);

    return {
      profile: profile as user_table,
      teamMemberProfile: teamMember as alliance_member_table,
      referal: referal as alliance_referral_link_table,
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

    const [profile, teamMember] = await Promise.all([
      prisma.user_table.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          user_first_name: true,
          user_last_name: true,
          user_profile_picture: true,
          user_username: true,
        },
      }),
      prisma.alliance_member_table.findFirst({
        where: { alliance_member_user_id: userId },
        select: {
          alliance_member_id: true,
          alliance_member_role: true,
          alliance_member_alliance_id: true,
          alliance_member_restricted: true,
          alliance_member_is_active: true,
        },
      }),
    ]);

    if (!profile) {
      return { redirect: "/login" };
    }

    if (
      !teamMember?.alliance_member_alliance_id ||
      !["ADMIN", "ACCOUNTING"].includes(teamMember.alliance_member_role)
    ) {
      return { redirect: "/login" };
    }

    if (teamMember.alliance_member_restricted) {
      return { redirect: "/login" };
    }

    const [referal] = await Promise.all([
      prisma.alliance_referral_link_table.findFirst({
        where: {
          alliance_referral_link_member_id: teamMember.alliance_member_id,
        },
      }),
    ]);

    return {
      profile: profile as user_table,
      teamMemberProfile: teamMember as alliance_member_table,
      referal: referal as alliance_referral_link_table,
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

    const [profile, teamMember] = await Promise.all([
      prisma.user_table.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          user_first_name: true,
          user_last_name: true,
          user_profile_picture: true,
          user_username: true,
          user_active_mobile: true,
        },
      }),
      prisma.alliance_member_table.findFirst({
        where: { alliance_member_user_id: userId },
        select: {
          alliance_member_id: true,
          alliance_member_role: true,
          alliance_member_alliance_id: true,
          alliance_member_restricted: true,
          alliance_member_user_id: true,
        },
      }),
    ]);

    if (!profile) {
      return { redirect: "/login" };
    }

    if (
      !teamMember?.alliance_member_alliance_id ||
      !["MEMBER", "MERCHANT", "ACCOUNTING", "ADMIN", "CLIENT"].includes(
        teamMember.alliance_member_role
      )
    ) {
      return { redirect: "/" };
    }

    if (teamMember.alliance_member_restricted) {
      return { redirect: "/login" };
    }

    const [referal] = await Promise.all([
      prisma.alliance_referral_link_table.findFirst({
        where: {
          alliance_referral_link_member_id: teamMember.alliance_member_id,
        },
      }),
    ]);

    return {
      profile: profile as user_table,
      teamMemberProfile: teamMember as alliance_member_table,
      referal: referal as alliance_referral_link_table,
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

export const protectionChatPageMemberUser = async (ip?: string) => {
  const supabase = await createClientServerSide();

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return { redirect: "/login" };
    }

    const userId = authData.user.id;

    const [profile, teamMember] = await Promise.all([
      prisma.user_table.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          user_first_name: true,
          user_last_name: true,
          user_profile_picture: true,
          user_username: true,
          user_active_mobile: true,
          user_email: true,
        },
      }),
      prisma.alliance_member_table.findFirst({
        where: { alliance_member_user_id: userId },
        select: {
          alliance_member_id: true,
          alliance_member_is_active: true,
          alliance_member_role: true,
          alliance_member_alliance_id: true,
          alliance_member_restricted: true,
          alliance_member_user_id: true,
        },
      }),
    ]);

    if (!profile) {
      return { redirect: "/500" };
    }

    if (
      !teamMember?.alliance_member_alliance_id ||
      !["MEMBER", "MERCHANT", "ACCOUNTING", "ADMIN"].includes(
        teamMember.alliance_member_role
      )
    ) {
      return { redirect: "/404" };
    }

    if (teamMember.alliance_member_restricted) {
      return { redirect: "/500" };
    }

    // if (!teamMember.alliance_member_is_active) {
    //   return { redirect: "/500" };
    // }

    const session = await prisma.chat_session_table.findFirst({
      where: {
        chat_session_alliance_member_id: teamMember.alliance_member_id,
      },
      select: {
        chat_session_id: true,
        chat_session_status: true,
        chat_session_date: true,
      },
      orderBy: {
        chat_session_date: "desc",
      },
    });

    return {
      profile: profile as user_table,
      teamMemberProfile: teamMember as alliance_member_table,
      session: session as chat_session_table,
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

export const protectionClientMonitoringUser = async (ip?: string) => {
  const supabase = await createClientServerSide();

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return { redirect: "/login" };
    }

    const userId = authData.user.id;

    const [profile, teamMember] = await Promise.all([
      prisma.user_table.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          user_first_name: true,
          user_last_name: true,
          user_profile_picture: true,
          user_username: true,
          user_active_mobile: true,
          user_email: true,
        },
      }),
      prisma.alliance_member_table.findFirst({
        where: { alliance_member_user_id: userId },
        select: {
          alliance_member_id: true,
          alliance_member_is_active: true,
          alliance_member_role: true,
          alliance_member_alliance_id: true,
          alliance_member_restricted: true,
          alliance_member_user_id: true,
        },
      }),
    ]);

    if (!profile) {
      return { redirect: "/500" };
    }

    if (
      !teamMember?.alliance_member_alliance_id ||
      !["CLIENT"].includes(teamMember.alliance_member_role)
    ) {
      return { redirect: "/404" };
    }

    if (teamMember.alliance_member_restricted) {
      return { redirect: "/500" };
    }

    return {
      profile: profile as user_table,
      teamMemberProfile: teamMember as alliance_member_table,
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
