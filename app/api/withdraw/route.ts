import { WITHDRAWAL_STATUS } from "@/utils/constant";
import {
  applyRateLimit,
  calculateFee,
  calculateFinalAmount,
  escapeFormData,
} from "@/utils/function";
import prisma from "@/utils/prisma";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { createClientServerSide } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const getWithdrawalHistorySchema = z.object({
  page: z.string().min(1),
  limit: z.string().min(1),
  search: z.string().optional(),
  columnAccessor: z.string().min(3),
  isAscendingSort: z.string().optional(),
  userId: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const { teamMemberProfile } = await protectionMemberUser();

    await applyRateLimit(teamMemberProfile?.alliance_member_id || "", ip);

    const supabaseClient = await createClientServerSide();

    const url = new URL(request.url);
    const page = url.searchParams.get("page") || "1";
    const limit = url.searchParams.get("limit") || "10";
    const search = url.searchParams.get("search") || "";
    const columnAccessor = url.searchParams.get("columnAccessor") || "";
    const isAscendingSort = url.searchParams.get("isAscendingSort") || "false";
    const userId = url.searchParams.get("userId") || "";

    const validate = getWithdrawalHistorySchema.safeParse({
      page,
      limit,
      search,
      columnAccessor,
      isAscendingSort,
      userId,
    });

    if (!validate.success) {
      return NextResponse.json(
        { error: validate.error.message },
        { status: 400 }
      );
    }

    const params = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      columnAccessor,
      userId: userId,
      isAscendingSort: isAscendingSort === "true",
      teamId: teamMemberProfile?.alliance_member_alliance_id || "",
    };
    const escapedParams = escapeFormData(params);
    const { data, error } = await supabaseClient.rpc(
      "get_member_withdrawal_history",
      {
        input_data: escapedParams,
      }
    );

    if (error) throw error;

    const { data: withdrawals, totalCount } = data;

    return NextResponse.json({ success: true, data: withdrawals, totalCount });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const withdrawalFormSchema = z.object({
  earnings: z.string(),
  amount: z
    .string()
    .min(2, "Minimum amount is required atleast 30 pesos")
    .refine((amount) => parseInt(amount, 10) >= 30, {
      message: "Amount must be at least 30 pesos",
    }),
  bank: z.string().min(1, "Please select a bank"),
  accountName: z
    .string()
    .min(6, "Account name is required")
    .max(40, "Account name must be at most 24 characters"),
  accountNumber: z
    .string()
    .min(6, "Account number is required")
    .max(24, "Account number must be at most 24 digits"),
});

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const {
      earnings,
      accountNumber,
      accountName,
      amount,
      bank,
      teamMemberId,
      email,
      cellphoneNumber,
    } = await request.json();

    const withdrawalData = withdrawalFormSchema.safeParse({
      earnings,
      accountNumber,
      accountName,
      amount,
      bank,
    });

    if (!withdrawalData.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    if (!["TOTAL"].includes(earnings)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (Number(amount) <= 0 || Number(amount) < 30) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { teamMemberProfile } = await protectionMemberUser(ip);
    // const today = new Date().toISOString().slice(0, 10); // Get the current date in YYYY-MM-DD format

    // const existingWithdrawal =
    //   await prisma.alliance_withdrawal_request_table.findFirst({
    //     where: {
    //       alliance_withdrawal_request_member_id: teamMemberId,
    //       AND: [
    //         {
    //           alliance_withdrawal_request_date: {
    //             gte: new Date(`${today}T00:00:00Z`), // Start of the day
    //           },
    //         },
    //         {
    //           alliance_withdrawal_request_date: {
    //             lte: new Date(`${today}T23:59:59Z`), // End of the day
    //           },
    //         },
    //       ],
    //     },
    //   });

    // if (existingWithdrawal) {
    //   return NextResponse.json(
    //     {
    //       error:
    //         "You have already made a withdrawal today. Please try again tomorrow.",
    //     },
    //     { status: 400 }
    //   );
    // }

    await applyRateLimit(teamMemberId, ip);

    const amountMatch = await prisma.alliance_earnings_table.findUnique({
      where: { alliance_earnings_member_id: teamMemberId },
      select: {
        alliance_olympus_earnings: true,
        alliance_referral_bounty: true,
        alliance_combined_earnings: true,
      },
    });

    if (!amountMatch || !teamMemberProfile?.alliance_member_is_active) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const {
      alliance_olympus_earnings,
      alliance_referral_bounty,
      alliance_combined_earnings,
    } = amountMatch;
    if (Number(amount) > alliance_combined_earnings) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    let remainingAmount = Number(amount);
    const olympusDeduction = Math.min(
      remainingAmount,
      Number(alliance_olympus_earnings)
    );
    remainingAmount -= olympusDeduction;

    const referralDeduction = Math.min(
      remainingAmount,
      Number(alliance_referral_bounty)
    );
    remainingAmount -= referralDeduction;

    if (remainingAmount > 0) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const [allianceData] = await prisma.$transaction([
      prisma.alliance_withdrawal_request_table.create({
        data: {
          alliance_withdrawal_request_amount: Number(amount),
          alliance_withdrawal_request_type: bank,
          alliance_withdrawal_request_account: accountNumber,
          alliance_withdrawal_request_fee: calculateFee(
            Number(amount),
            earnings
          ),
          alliance_withdrawal_request_email: email ? email : null,
          alliance_withdrawal_request_cellphone_number: cellphoneNumber
            ? cellphoneNumber
            : null,
          alliance_withdrawal_request_withdraw_amount: calculateFinalAmount(
            Number(amount),
            earnings
          ),
          alliance_withdrawal_request_bank_name: accountName,
          alliance_withdrawal_request_status: WITHDRAWAL_STATUS.PENDING,
          alliance_withdrawal_request_member_id: teamMemberId,
          alliance_withdrawal_request_earnings_amount: olympusDeduction,
          alliance_withdrawal_request_referral_amount: referralDeduction,
          alliance_withdrawal_request_withdraw_type: earnings,
        },
      }),
      prisma.alliance_earnings_table.update({
        where: { alliance_earnings_member_id: teamMemberId },
        data: {
          alliance_olympus_earnings: { decrement: olympusDeduction },
          alliance_referral_bounty: { decrement: referralDeduction },
          alliance_combined_earnings: { decrement: Number(amount) },
        },
      }),
      prisma.alliance_transaction_table.create({
        data: {
          transaction_amount: calculateFinalAmount(Number(amount), "TOTAL"),
          transaction_description: "Withdrawal Ongoing",
          transaction_member_id: teamMemberId,
        },
      }),

      prisma.alliance_notification_table.create({
        data: {
          alliance_notification_user_id: teamMemberId,
          alliance_notification_message: `Withdrawal request is Ongoing amounting to ₱ ${calculateFinalAmount(
            Number(amount),
            earnings
          ).toLocaleString("en-US", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          })} Please wait for approval.`,
        },
      }),
    ]);

    if (!allianceData) {
      return NextResponse.json(
        {
          error: "Failed to create withdrawal request. Please try again later.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 }
    );
  }
}
