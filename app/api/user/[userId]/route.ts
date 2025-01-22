import { WITHDRAWAL_STATUS } from "@/utils/constant";
import { loginRateLimit } from "@/utils/function";
import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
import {
  protectionAdminUser,
  protectionMemberUser,
} from "@/utils/serversideProtection";
import { createServiceRoleClientServerSide } from "@/utils/supabase/server";
import { alliance_earnings_table } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  iv: z.string().min(6),
  clientpass: z.string().min(6),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createServiceRoleClientServerSide();

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    if (ip === "unknown") {
      return NextResponse.json(
        { error: "Unable to determine IP address for rate limiting." },
        { status: 400 }
      );
    }

    await protectionMemberUser(ip);

    const isAllowed = await rateLimit(`rate-limit:${ip}`, 10, 60);

    if (!isAllowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { userId } = await context.params;

    const { email, password, iv, clientpass } = await request.json();

    const validate = updateUserSchema.safeParse({
      email,
      password,
      iv,
      clientpass,
    });

    if (!validate.success) {
      return NextResponse.json(
        { error: validate.error.message },
        { status: 400 }
      );
    }

    if (!password || !email || !userId) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user_table.findFirst({
      where: {
        user_email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    const teamMemberProfile = await prisma.alliance_member_table.findFirst({
      where: { alliance_member_user_id: user?.user_id },
      select: {
        alliance_member_restricted: true,
        alliance_member_alliance_id: true,
      },
    });

    if (!teamMemberProfile) {
      return NextResponse.json(
        { error: "User profile not found or incomplete." },
        { status: 403 }
      );
    }

    if (
      teamMemberProfile.alliance_member_restricted ||
      !teamMemberProfile.alliance_member_alliance_id
    ) {
      return NextResponse.json(
        { success: false, error: "Access restricted or incomplete profile." },
        { status: 403 }
      );
    }

    await prisma.user_table.update({
      where: {
        user_id: userId,
      },
      data: {
        user_password: password,
      },
    });

    await supabase.auth.admin.updateUserById(userId, {
      password: clientpass,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    if (ip === "unknown") {
      return NextResponse.json(
        { error: "Unable to determine IP address for rate limiting." },
        { status: 400 }
      );
    }

    await protectionAdminUser(ip);

    loginRateLimit(ip);
    const { userId } = await context.params;
    if (!userId) {
      return NextResponse.json({ error: "There is no user" }, { status: 400 });
    }

    const { action, role } = await request.json();

    if (action === "updateRole") {
      await prisma.alliance_member_table.update({
        where: { alliance_member_id: userId },
        data: {
          alliance_member_role: role,

          alliance_member_is_active: role.includes(
            "ADMIN",
            "MERCHANT",
            "ACCOUNTING"
          )
            ? true
            : false,
        },
      });

      if (role === "MERCHANT") {
        await prisma.merchant_member_table.create({
          data: {
            merchant_member_merchant_id: userId,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "User role updated successfully.",
      });
    }

    if (action === "banUser") {
      await prisma.alliance_member_table.update({
        where: { alliance_member_id: userId },
        data: { alliance_member_restricted: true },
      });

      return NextResponse.json({
        success: true,
        message: "User banned successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 }
    );
  }
}

const getUserEarningsSchema = z.object({
  userId: z.string().uuid(),
});

export const POST = async (
  request: Request,
  context: { params: Promise<{ userId: string }> }
) => {
  try {
    const { userId } = await context.params;

    const params = {
      userId,
    };

    const validate = getUserEarningsSchema.safeParse(params);

    if (!validate.success) {
      return NextResponse.json(
        { error: validate.error.message },
        { status: 400 }
      );
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

    const userEarnings = await prisma.alliance_earnings_table.findUnique({
      where: {
        alliance_earnings_member_id: userId,
      },
    });

    return NextResponse.json({
      userEarningsData: userEarnings as unknown as alliance_earnings_table,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 }
    );
  }
};

export const GET = async (
  request: Request,
  context: { params: Promise<{ userId: string }> }
) => {
  try {
    const { userId } = await context.params;

    const validate = getUserEarningsSchema.safeParse({ userId });

    if (!validate.success) {
      return NextResponse.json(
        { error: validate.error.message },
        { status: 400 }
      );
    }

    let isWithdrawalToday = false;
    const today = new Date().toISOString().split("T")[0];
    const existingWithdrawal =
      await prisma.alliance_withdrawal_request_table.findFirst({
        where: {
          alliance_withdrawal_request_member_id: userId,
          alliance_withdrawal_request_status: WITHDRAWAL_STATUS.APPROVED,
          AND: [
            {
              alliance_withdrawal_request_date: {
                gte: new Date(`${today}T00:00:00Z`), // Start of the day
              },
            },
            {
              alliance_withdrawal_request_date: {
                lte: new Date(`${today}T23:59:59Z`), // End of the day
              },
            },
          ],
        },
      });

    if (existingWithdrawal) {
      isWithdrawalToday = true;
    }
    return NextResponse.json({ isWithdrawalToday });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 }
    );
  }
};
