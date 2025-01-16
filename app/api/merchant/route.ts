import { applyRateLimitMember, loginRateLimit } from "@/utils/function";
import prisma from "@/utils/prisma";
import {
  protectionAdminUser,
  protectionAllUser,
  protectionMerchantUser,
} from "@/utils/serversideProtection";
import { NextResponse } from "next/server";
import { z } from "zod";

function sendErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

const updateMerchantBalanceSchema = z.object({
  amount: z.number().min(1),
  memberId: z.string().uuid(),
});

export async function PATCH(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    if (ip === "unknown")
      return sendErrorResponse(
        "Unable to determine IP address for rate limiting."
      );

    await protectionAdminUser(ip);
    loginRateLimit(ip);

    const validate = updateMerchantBalanceSchema.safeParse(
      await request.json()
    );

    if (!validate.success) {
      throw new Error(validate.error.message);
    }

    const { amount, memberId } = validate.data;

    const result = await prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant_member_table.findFirst({
        where: { merchant_member_id: memberId },
      });

      if (!merchant) throw new Error("Merchant not found");

      return await tx.merchant_member_table.update({
        where: { merchant_member_id: memberId },
        data: {
          merchant_member_balance: {
            increment: amount,
          },
        },
      });
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    if (ip === "unknown")
      return sendErrorResponse(
        "Unable to determine IP address for rate limiting."
      );

    await protectionMerchantUser(ip);

    applyRateLimitMember(ip);

    const { accountNumber, accountType, accountName } = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant_table.findFirst({
        where: { merchant_account_number: accountNumber },
      });

      if (merchant) throw new Error("Merchant already exists");

      return await tx.merchant_table.create({
        data: {
          merchant_account_number: accountNumber,
          merchant_account_type: accountType,
          merchant_account_name: accountName,
        },
      });
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    if (ip === "unknown")
      return sendErrorResponse(
        "Unable to determine IP address for rate limiting."
      );

    await protectionMerchantUser(ip);
    loginRateLimit(ip);

    const { merchantId } = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant_table.findFirst({
        where: { merchant_id: merchantId },
      });

      if (!merchant) throw new Error("Merchant not found");

      return await tx.merchant_table.delete({
        where: { merchant_id: merchantId },
      });
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error." },
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

    if (ip === "unknown")
      return sendErrorResponse(
        "Unable to determine IP address for rate limiting."
      );

    await protectionAllUser(ip);

    loginRateLimit(ip);

    const merchant = await prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant_table.findMany({
        select: {
          merchant_id: true,
          merchant_account_number: true,
          merchant_account_type: true,
          merchant_account_name: true,
        },
      });

      return merchant;
    });

    return NextResponse.json({ success: true, data: merchant });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error." },
      { status: 500 }
    );
  }
}
