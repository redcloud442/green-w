import { WITHDRAWAL_STATUS } from "@/utils/constant";
import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
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

    const isAllowed = await rateLimit(
      `rate-limit:${teamMemberProfile?.alliance_member_id}`,
      10,
      60
    );

    if (!isAllowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingRequest =
        await tx.alliance_withdrawal_request_table.findUnique({
          where: {
            alliance_withdrawal_request_id: requestId,
          },
        });

      if (!existingRequest) {
        throw new Error("Request not found.");
      }

      const requestor = await tx.alliance_member_table.findUnique({
        where: {
          alliance_member_id:
            existingRequest?.alliance_withdrawal_request_member_id,
        },
        select: {
          user_table: {
            select: {
              user_username: true,
            },
          },
        },
      });

      // Access the username
      const username = requestor?.user_table?.user_username;

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
          alliance_withdrawal_request_date_updated: new Date(),
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
              increment: Number(
                updatedRequest.alliance_withdrawal_request_earnings_amount
              ),
            },
            alliance_olympus_earnings: {
              increment: Number(
                updatedRequest.alliance_withdrawal_request_earnings_amount
              ),
            },
            alliance_combined_earnings: {
              increment: Number(
                updatedRequest.alliance_withdrawal_request_amount
              ),
            },
          },
        });
      }

      await tx.alliance_transaction_table.create({
        data: {
          transaction_description: `${
            status === WITHDRAWAL_STATUS.APPROVED
              ? "Congratulations! Withdrawal Request Sent"
              : `Withdrawal Request Failed, ${note}`
          }`,
          transaction_amount: Number(
            updatedRequest.alliance_withdrawal_request_amount -
              updatedRequest.alliance_withdrawal_request_fee
          ),
          transaction_member_id:
            updatedRequest.alliance_withdrawal_request_member_id,
        },
      });

      await tx.alliance_notification_table.create({
        data: {
          alliance_notification_user_id:
            updatedRequest.alliance_withdrawal_request_member_id,
          alliance_notification_message: `${
            status === WITHDRAWAL_STATUS.APPROVED
              ? "Congratulations! Withdrawal Request Sent"
              : `Withdrawal Request Failed, ${note}`
          }`,
        },
      });

      return { updatedRequest, username };
    });

    // Custom serialization to handle BigInt values
    const stringifyWithBigInt = (
      key: string,
      value: string | number | bigint
    ) => {
      if (typeof value === "bigint") {
        return value.toString(); // Convert BigInt to string
      }
      return value;
    };

    return NextResponse.json(
      JSON.parse(
        JSON.stringify({ success: true, data: result }, stringifyWithBigInt)
      )
    );
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
