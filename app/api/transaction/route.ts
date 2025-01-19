import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createTransactionSchema = z.object({
  limit: z.number().min(1),
  page: z.number().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Extract `limit` and `page` from the request body
    const { limit = 10, page = 1 } = await request.json();

    const validate = createTransactionSchema.safeParse({
      limit,
      page,
    });

    if (!validate.success) {
      return NextResponse.json(
        { error: validate.error.message },
        { status: 400 }
      );
    }

    // Validate `limit` and `page` to avoid misuse
    const safeLimit = Math.min(Math.max(Number(limit), 1), 100); // Limit between 1 and 100
    const safePage = Math.max(Number(page), 1); // Ensure page is at least 1

    const { teamMemberProfile } = await protectionMemberUser();

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

    if (!teamMemberProfile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (limit !== 10) {
      return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
    }

    // Fetch total count of transactions for the user
    const totalTransactions = await prisma.alliance_transaction_table.count({
      where: {
        alliance_member_table: {
          alliance_member_id: teamMemberProfile.alliance_member_id,
        },
      },
    });

    // Calculate the offset for pagination
    const offset = (safePage - 1) * safeLimit;

    // Fetch the paginated transaction history
    const transactionHistory = await prisma.alliance_transaction_table.findMany(
      {
        where: {
          alliance_member_table: {
            alliance_member_id: teamMemberProfile.alliance_member_id,
          },
        },
        select: {
          transaction_description: true,
          transaction_amount: true, // BigInt column
          transaction_date: true,
        },
        skip: offset,
        take: safeLimit,
        orderBy: {
          transaction_date: "desc",
        },
      }
    );

    // Convert BigInt to string for JSON serialization
    const serializedTransactionHistory = transactionHistory.map(
      (transaction) => ({
        ...transaction,
        transaction_amount: transaction.transaction_amount?.toString() || "0",
      })
    );

    // Return the paginated data and total count
    return NextResponse.json({
      transactionHistory: serializedTransactionHistory,
      totalTransactions,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
