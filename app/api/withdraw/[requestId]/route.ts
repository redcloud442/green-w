import { WITHDRAWAL_STATUS } from "@/utils/constant";
import { applyRateLimit } from "@/utils/function";
import prisma from "@/utils/prisma";
import { protectionAccountingUser } from "@/utils/serversideProtection";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function sendErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

const updateWithdrawalRequestSchema = z.object({
  status: z.string().min(3),
  note: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const { requestId } = await context.params;

    if (!requestId) return sendErrorResponse("Request ID is required.");

    const { status, note }: { status: string; note?: string | null } =
      await request.json();

    const validate = updateWithdrawalRequestSchema.safeParse({
      status,
      note,
    });

    if (!validate.success) {
      return NextResponse.json(
        { error: validate.error.message },
        { status: 400 }
      );
    }

    if (!status || !Object.values(WITHDRAWAL_STATUS).includes(status)) {
      return sendErrorResponse("Invalid or missing status.");
    }

    const { teamMemberProfile } = await protectionAccountingUser(ip);

    if (!teamMemberProfile)
      return sendErrorResponse("User authentication failed.", 401);

    await applyRateLimit(teamMemberProfile.alliance_member_id, ip);

    const result = await prisma.$transaction(async (tx) => {
      const existingRequest =
        await tx.alliance_withdrawal_request_table.findUnique({
          where: { alliance_withdrawal_request_id: requestId },
        });

      if (existingRequest?.alliance_withdrawal_request_status !== "PENDING") {
        throw new Error("Request has already been processed.");
      }

      const updatedRequest = await tx.alliance_withdrawal_request_table.update({
        where: { alliance_withdrawal_request_id: requestId },
        data: {
          alliance_withdrawal_request_status: status,
          alliance_withdrawal_request_approved_by:
            teamMemberProfile.alliance_member_id,
          alliance_withdrawal_request_reject_note: note ?? null,
        },
      });

      if (status === WITHDRAWAL_STATUS.REJECTED) {
        await tx.alliance_earnings_table.update({
          where: {
            alliance_earnings_member_id:
              updatedRequest.alliance_withdrawal_request_member_id,
          },
          data: {
            alliance_olympus_wallet: {
              increment:
                updatedRequest.alliance_withdrawal_request_earnings_amount,
            },
            alliance_olympus_earnings: {
              increment:
                updatedRequest.alliance_withdrawal_request_earnings_amount,
            },
            alliance_combined_earnings: {
              increment: updatedRequest.alliance_withdrawal_request_amount,
            },
          },
        });
      }

      await tx.alliance_transaction_table.create({
        data: {
          transaction_description: `Withdrawal ${status === WITHDRAWAL_STATUS.APPROVED ? "Success" : "Failed"} ${note ? `(${note})` : ""}`,
          transaction_amount: updatedRequest.alliance_withdrawal_request_amount,
          transaction_member_id:
            updatedRequest.alliance_withdrawal_request_member_id,
        },
      });

      await tx.alliance_notification_table.create({
        data: {
          alliance_notification_user_id:
            updatedRequest.alliance_withdrawal_request_member_id,
          alliance_notification_message: `Withdrawal is ${status.slice(0, 1).toUpperCase() + status.slice(1).toLowerCase()} amounting to ${updatedRequest.alliance_withdrawal_request_amount}, ${status === WITHDRAWAL_STATUS.REJECTED ? `( due to ${note})` : "Please check your account for the transaction."}`,
        },
      });

      return updatedRequest;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}
