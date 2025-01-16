import { TOP_UP_STATUS } from "@/utils/constant";
import { applyRateLimit } from "@/utils/function";
import prisma from "@/utils/prisma";
import { protectionMerchantUser } from "@/utils/serversideProtection";
import { NextRequest, NextResponse } from "next/server";

// Helper function for returning error responses
function sendErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

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

    if (!requestId) return sendErrorResponse("Invalid request.");

    const { status, note }: { status: string; note?: string | null } =
      await request.json();

    if (!status || !Object.values(TOP_UP_STATUS).includes(status)) {
      return sendErrorResponse("Invalid request.");
    }

    const { teamMemberProfile } = await protectionMerchantUser(ip);

    if (!teamMemberProfile) {
      return sendErrorResponse("User authentication failed.", 401);
    }

    await applyRateLimit(teamMemberProfile.alliance_member_id, ip);

    const [existingRequest, merchant] = await Promise.all([
      prisma.alliance_top_up_request_table.findUnique({
        where: { alliance_top_up_request_id: requestId },
      }),
      prisma.merchant_member_table.findFirst({
        where: {
          merchant_member_merchant_id: teamMemberProfile.alliance_member_id,
        },
      }),
    ]);

    if (!existingRequest) return sendErrorResponse("Request not found.", 404);
    if (!merchant && teamMemberProfile.alliance_member_role === "MERCHANT")
      return sendErrorResponse("Merchant not found.", 404);

    if (
      existingRequest.alliance_top_up_request_status !== TOP_UP_STATUS.PENDING
    ) {
      return sendErrorResponse("Invalid request.");
    }

    if (
      status === TOP_UP_STATUS.APPROVED &&
      teamMemberProfile.alliance_member_role === "MERCHANT" &&
      existingRequest.alliance_top_up_request_amount >
        (merchant?.merchant_member_balance ?? 0)
    ) {
      return sendErrorResponse("Insufficient merchant balance.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.alliance_top_up_request_table.update({
        where: { alliance_top_up_request_id: requestId },
        data: {
          alliance_top_up_request_status: status,
          alliance_top_up_request_approved_by:
            teamMemberProfile.alliance_member_id,
          alliance_top_up_request_reject_note: note ?? null,
        },
      });

      await tx.alliance_transaction_table.create({
        data: {
          transaction_description: `Deposit ${status === TOP_UP_STATUS.APPROVED ? "Success" : "Failed"} ${note ? `(${note})` : ""}`,
          transaction_amount: updatedRequest.alliance_top_up_request_amount,
          transaction_member_id:
            updatedRequest.alliance_top_up_request_member_id,
        },
      });

      if (status === TOP_UP_STATUS.APPROVED) {
        const updatedEarnings = await tx.alliance_earnings_table.update({
          where: {
            alliance_earnings_member_id:
              updatedRequest.alliance_top_up_request_member_id,
          },
          data: {
            alliance_olympus_wallet: {
              increment: updatedRequest.alliance_top_up_request_amount,
            },
            alliance_combined_earnings: {
              increment: updatedRequest.alliance_top_up_request_amount,
            },
          },
        });

        if (merchant) {
          const updatedMerchant = await tx.merchant_member_table.update({
            where: { merchant_member_id: merchant.merchant_member_id },
            data: {
              merchant_member_balance: {
                decrement: updatedRequest.alliance_top_up_request_amount,
              },
            },
          });

          return {
            updatedRequest,
            updatedEarnings,
            updatedMerchant,
          };
        }

        return { updatedRequest, updatedEarnings };
      }

      return { updatedRequest };
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error occurred.",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
