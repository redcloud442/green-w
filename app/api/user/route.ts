import { applyRateLimit } from "@/utils/function";
import prisma from "@/utils/prisma";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { createClientServerSide } from "@/utils/supabase/server";
import { alliance_preferred_withdrawal_table } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  iv: z.string().min(6),
});

export async function PUT(request: Request) {
  try {
    // Extract and validate IP address
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

    const { teamMemberProfile: profile } = await protectionMemberUser();

    applyRateLimit(profile?.alliance_member_id || "", ip);

    const { email, password, userId } = await request.json();

    const validate = updateUserSchema.safeParse({
      email,
      password,
      userId,
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

    // Fetch user from database
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
    });

    if (!teamMemberProfile) {
      return NextResponse.json({ error: "Invalid request." }, { status: 403 });
    }

    if (
      teamMemberProfile.alliance_member_restricted ||
      !teamMemberProfile.alliance_member_alliance_id
    ) {
      return NextResponse.json(
        { success: false, error: "Access restricted" },
        { status: 403 }
      );
    }

    prisma.user_table.update({
      where: {
        user_id: userId,
      },
      data: {
        user_password: password,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    const { teamMemberProfile } = await protectionMemberUser();

    const supabase = await createClientServerSide();

    applyRateLimit(teamMemberProfile?.alliance_member_id || "", ip);

    const { data, error } = await supabase.rpc("get_earnings_modal_data", {
      input_data: {
        teamMemberId: teamMemberProfile?.alliance_member_id || "",
      },
    });
    if (error) throw error;

    const preferredWithdrawal =
      await prisma.alliance_preferred_withdrawal_table.findMany({
        where: {
          alliance_preferred_withdrawal_member_id:
            teamMemberProfile?.alliance_member_id,
        },
      });

    const serializeBigInt = (data: any) =>
      JSON.parse(
        JSON.stringify(data, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

    const serializedData = serializeBigInt(data);

    const serializedPreferredWithdrawal = serializeBigInt(
      preferredWithdrawal as alliance_preferred_withdrawal_table[]
    );

    return NextResponse.json({
      success: true,
      data: serializedData,
      preferredWithdrawal: serializedPreferredWithdrawal,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 }
    );
  }
}
