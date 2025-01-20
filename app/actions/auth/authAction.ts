"use server";

import { hashData } from "@/utils/function";
import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
import {
  protectionAdminUser,
  protectionMemberUser,
} from "@/utils/serversideProtection";
import {
  createClientServerSide,
  createServiceRoleClientServerSide,
} from "@/utils/supabase/server";
import crypto from "crypto";
import { z } from "zod";

const changeUserPasswordSchema = z.object({
  email: z.string().email(),
  userId: z.string().uuid(),
  password: z.string().min(6),
});

export const changeUserPassword = async (params: {
  email: string;
  userId: string;
  password: string;
}) => {
  const validate = changeUserPasswordSchema.safeParse(params);

  if (!validate.success) {
    throw new Error(validate.error.message);
  }

  const { email, password, userId } = validate.data;

  const { teamMemberProfile: role } = await protectionMemberUser();

  const isAllowed = await rateLimit(
    `rate-limit:${role?.alliance_member_id}`,
    10,
    60
  );

  if (!isAllowed) {
    throw new Error("Too many requests. Please try again later.");
  }

  const iv = crypto.randomBytes(16);
  const allowedKey = process.env.ALLOWED_CRYPTO_KEY;

  if (!allowedKey) {
    throw new Error("CRYPTO_SECRET_KEY is not defined");
  }

  if (allowedKey.length !== 64) {
    throw new Error(
      "CRYPTO_SECRET_KEY must be a 32-byte (64 characters) hex string"
    );
  }

  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(allowedKey, "hex"),
    iv
  );

  let encrypted = cipher.update(password, "utf-8", "hex");
  encrypted += cipher.final("hex");

  if (!password || !email || !userId) {
    throw new Error("Invalid input");
  }

  // Fetch user data from Prisma
  const user = await prisma.user_table.findFirst({
    where: {
      user_email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  // Fetch team member profile
  const teamMemberProfile = await prisma.alliance_member_table.findFirst({
    where: { alliance_member_user_id: user.user_id },
  });

  if (!teamMemberProfile) {
    throw new Error("User profile not found or incomplete.");
  }

  if (
    teamMemberProfile.alliance_member_restricted ||
    !teamMemberProfile.alliance_member_alliance_id
  ) {
    throw new Error("Access restricted or incomplete profile.");
  }

  // Update user data in the database
  await prisma.$transaction(async (tx) => {
    await tx.user_table.update({
      where: {
        user_id: userId,
      },
      data: {
        user_password: encrypted,
        user_iv: iv.toString("hex"),
      },
    });
  });

  // Update password in Supabase
  if (role?.alliance_member_role !== "ADMIN") {
    const supabaseClient = await createClientServerSide();
    const { error } = await supabaseClient.auth.updateUser({
      email: email,
      password: password,
    });
    if (error) {
      throw new Error("Failed to update user password");
    }
  } else {
    const supabaseClient = await createServiceRoleClientServerSide();
    await supabaseClient.auth.admin.updateUserById(userId, {
      password: password,
    });
  }
  return { success: true, iv: iv.toString("hex"), creds: encrypted };
};

const registerUserSchema = z.object({
  userName: z.string().min(6),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  activeMobile: z.string().min(10),
  activeEmail: z.string().email(),
  referalLink: z.string().min(2),
  url: z.string().min(2),
});

export const registerUser = async (params: {
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  activeMobile: string;
  activeEmail: string;
  referalLink: string;
  url: string;
}) => {
  try {
    const supabaseClient = await createClientServerSide();
    const validate = registerUserSchema.safeParse(params);

    if (!validate.success) {
      throw new Error(validate.error.message);
    }

    const { teamMemberProfile } = await protectionMemberUser();

    const isAllowed = await rateLimit(
      `rate-limit:${teamMemberProfile?.alliance_member_id}`,
      10,
      60
    );

    if (!isAllowed) {
      throw new Error("Too many requests. Please try again later.");
    }

    const {
      userName,
      password,
      firstName,
      lastName,
      activeMobile,
      activeEmail,
      referalLink,
      url,
    } = params;

    const formatUsername = userName + "@gmail.com";

    const { iv, encryptedData } = await hashData(password);

    const { data: userData, error: userError } =
      await supabaseClient.auth.signUp({ email: formatUsername, password });

    if (userError) throw userError;

    const userParams = {
      userName,
      activeMobile,
      email: activeEmail,
      password: encryptedData,
      userId: userData.user?.id,
      firstName,
      lastName,
      referalLink,
      iv,
      url,
    };

    const { error } = await supabaseClient.rpc("create_user_trigger", {
      input_data: userParams,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "An unknown error occurred."
    );
  }
};

const signInUserSchema = z.object({
  formattedUserName: z.string().email(),
});

export const handleSignInUser = async (params: {
  formattedUserName: string;
}) => {
  try {
    const supabaseClient = await createServiceRoleClientServerSide();
    const validate = signInUserSchema.safeParse(params);

    if (!validate.success) {
      throw new Error(validate.error.message);
    }

    const { formattedUserName } = params;

    const { teamMemberProfile } = await protectionAdminUser();

    const isAllowed = await rateLimit(
      `rate-limit:${teamMemberProfile?.alliance_member_id}`,
      10,
      60
    );

    if (!isAllowed) {
      throw new Error("Too many requests. Please try again later.");
    }

    const { data, error } = await supabaseClient.auth.admin.generateLink({
      type: "magiclink",
      email: formattedUserName,
    });

    if (error) throw error;
    return { success: true, url: data.properties };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "An unknown error occurred."
    );
  }
};

const signInAdminSchema = z.object({
  userName: z
    .string()
    .min(6, "Username must be at least 6 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
});

export const handleSigninAdmin = async (params: { userName: string }) => {
  try {
    const validate = signInAdminSchema.safeParse(params);

    if (!validate.success) {
      throw new Error(validate.error.message);
    }

    const { userName } = params;

    const { teamMemberProfile } = await protectionAdminUser();

    const isAllowed = await rateLimit(
      `rate-limit:${teamMemberProfile?.alliance_member_id}`,
      10,
      60
    );

    if (!isAllowed) {
      throw new Error("Too many requests. Please try again later.");
    }

    const user = await prisma.user_table.findFirst({
      where: {
        user_username: userName,
      },
      select: {
        user_id: true,
        user_active_mobile: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const teamMember = await prisma.alliance_member_table.findFirst({
      where: {
        alliance_member_user_id: user.user_id,
        alliance_member_role: "ADMIN",
      },
    });

    if (!teamMember) {
      throw new Error("User is not an admin");
    }

    return { success: true, user };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "An unknown error occurred."
    );
  }
};
