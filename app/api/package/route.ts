import { applyRateLimit } from "@/utils/function";
import prisma from "@/utils/prisma";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { createClientServerSide } from "@/utils/supabase/server";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const { teamMemberProfile } = await protectionMemberUser(ip);

    await applyRateLimit(teamMemberProfile?.alliance_member_id || "", ip);

    const supabaseClient = await createClientServerSide();

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const page = url.searchParams.get("page") || 1;
    const limit = url.searchParams.get("limit") || 10;
    const sortBy = url.searchParams.get("sortBy") || true;
    const columnAccessor = url.searchParams.get("columnAccessor") || "";
    const teamMemberId = url.searchParams.get("teamMemberId") || "";

    const { data, error } = await supabaseClient.rpc(
      "get_member_package_history",
      {
        input_data: {
          search,
          page,
          limit,
          sortBy,
          columnAccessor,
          teamMemberId,
        },
      }
    );

    if (error) throw error;

    return NextResponse.json({ success: true, data: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 }
    );
  }
}

const topupSchema = z.object({
  amount: z
    .number()
    .min(1, "Minimum amount is 1 pesos")
    .refine((val) => !isNaN(Number(val)), {
      message: "Amount must be a number",
    }),
  packageId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const { amount, packageId, teamMemberId } = await request.json();

    // Validate input data
    const parsedData = topupSchema.safeParse({ amount, packageId });
    if (!parsedData.success) {
      return NextResponse.json(
        { error: parsedData.error.message },
        { status: 400 }
      );
    }

    const integerLength = Math.floor(amount).toString().length;
    if (
      !amount ||
      !packageId ||
      !teamMemberId ||
      amount === 0 ||
      integerLength < 1
    ) {
      return NextResponse.json(
        { error: "Invalid input or amount must be between 1 and 1 digits." },
        { status: 400 }
      );
    }

    const { teamMemberProfile } = await protectionMemberUser(ip);
    await applyRateLimit(teamMemberId, ip);

    // Round off amount and convert to BigInt
    const roundedAmount = Math.round(amount); // Remove decimals
    const amountBigInt = BigInt(roundedAmount); // Convert to BigInt

    const [packageData, earningsData, referralData] = await Promise.all([
      prisma.package_table.findUnique({
        where: { package_id: packageId },
        select: {
          package_percentage: true,
          package_is_disabled: true,
          package_name: true,
        },
      }),
      prisma.alliance_earnings_table.findUnique({
        where: { alliance_earnings_member_id: teamMemberId },
        select: {
          alliance_olympus_wallet: true,
          alliance_referral_bounty: true,
          alliance_olympus_earnings: true,
          alliance_combined_earnings: true,
        },
      }),
      prisma.alliance_referral_table.findFirst({
        where: { alliance_referral_member_id: teamMemberId },
        select: { alliance_referral_hierarchy: true },
      }),
    ]);

    if (!packageData) {
      return NextResponse.json(
        { error: "Package not found." },
        { status: 404 }
      );
    }

    if (packageData.package_is_disabled) {
      return NextResponse.json(
        { error: "Package is disabled." },
        { status: 400 }
      );
    }

    if (!earningsData) {
      return NextResponse.json(
        { error: "Earnings record not found." },
        { status: 404 }
      );
    }

    const {
      alliance_olympus_wallet,
      alliance_olympus_earnings,
      alliance_referral_bounty,
      alliance_combined_earnings,
    } = earningsData;

    const combinedEarnings = Math.round(Number(alliance_combined_earnings));
    if (combinedEarnings < roundedAmount) {
      return NextResponse.json(
        { error: "Insufficient balance in the combined wallet." },
        { status: 400 }
      );
    }

    // Deduct from the wallets
    const {
      olympusWallet,
      olympusEarnings,
      referralWallet,
      updatedCombinedWallet,
    } = deductFromWallets(
      roundedAmount,
      combinedEarnings,
      Math.round(Number(alliance_olympus_wallet)),
      Math.round(Number(alliance_olympus_earnings)),
      Math.round(Number(alliance_referral_bounty))
    );

    const packagePercentage = new Prisma.Decimal(
      Number(packageData.package_percentage)
    ).div(100);

    const packageAmountEarnings = Math.round(
      Number(
        new Prisma.Decimal(roundedAmount).mul(packagePercentage).toNumber()
      )
    );

    // Generate referral chain with a capped depth
    const referralChain = generateReferralChain(
      referralData?.alliance_referral_hierarchy ?? null,
      teamMemberId,
      100 // Cap the depth to 100 levels
    );

    const connectionData = await prisma.$transaction(async (tx) => {
      const connectionData = await tx.package_member_connection_table.create({
        data: {
          package_member_member_id: teamMemberId,
          package_member_package_id: packageId,
          package_member_amount: amountBigInt,
          package_amount_earnings: BigInt(packageAmountEarnings),
          package_member_status: "ACTIVE",
        },
      });

      await tx.alliance_earnings_table.update({
        where: { alliance_earnings_member_id: teamMemberId },
        data: {
          alliance_combined_earnings: BigInt(updatedCombinedWallet),
          alliance_olympus_wallet: BigInt(olympusWallet),
          alliance_olympus_earnings: BigInt(olympusEarnings),
          alliance_referral_bounty: BigInt(referralWallet),
        },
      });

      return connectionData;
    });

    // Process referral chain and logs
    if (referralChain.length > 0) {
      await Promise.all(
        referralChain.map((ref) =>
          prisma.alliance_earnings_table.update({
            where: { alliance_earnings_member_id: ref.referrerId },
            data: {
              alliance_referral_bounty: {
                increment: BigInt(
                  Math.round(
                    Number(
                      new Prisma.Decimal(roundedAmount)
                        .mul(ref.percentage)
                        .div(100)
                        .toNumber()
                    )
                  )
                ),
              },
              alliance_combined_earnings: {
                increment: BigInt(
                  Math.round(
                    Number(
                      new Prisma.Decimal(roundedAmount)
                        .mul(ref.percentage)
                        .div(100)
                        .toNumber()
                    )
                  )
                ),
              },
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 }
    );
  }
}

function generateReferralChain(
  hierarchy: string | null,
  teamMemberId: string,
  maxDepth = 100
) {
  if (!hierarchy) return [];

  const hierarchyArray = hierarchy.split(".");
  const currentIndex = hierarchyArray.indexOf(teamMemberId);

  if (currentIndex === -1) {
    throw new Error("Current member ID not found in the hierarchy.");
  }

  return hierarchyArray
    .slice(0, currentIndex)
    .reverse()
    .slice(0, maxDepth)
    .map((referrerId, index) => ({
      referrerId,
      percentage: getBonusPercentage(index + 1),
      level: index + 1,
    }));
}

function getBonusPercentage(level: number): number {
  const bonusMap: Record<number, number> = {
    1: 10,
    2: 1.5,
    3: 1.5,
    4: 1.5,
    5: 1,
    6: 1,
    7: 1,
    8: 1,
    9: 1,
    10: 1,
  };

  return bonusMap[level] || 0;
}

function deductFromWallets(
  amount: number,
  combinedWallet: number,
  olympusWallet: number,
  olympusEarnings: number,
  referralWallet: number
) {
  let remaining = amount;

  // Validate total funds
  if (combinedWallet < amount) {
    throw new Error("Insufficient balance in combined wallet.");
  }

  // Deduct from Olympus Wallet first
  if (olympusWallet >= remaining) {
    olympusWallet -= remaining;
    remaining = 0;
  } else {
    remaining -= olympusWallet;
    olympusWallet = 0;
  }

  // Deduct from Olympus Earnings next
  if (remaining > 0) {
    if (olympusEarnings >= remaining) {
      olympusEarnings -= remaining;
      remaining = 0;
    } else {
      remaining -= olympusEarnings;
      olympusEarnings = 0;
    }
  }

  // Deduct from Referral Wallet
  if (remaining > 0) {
    if (referralWallet >= remaining) {
      referralWallet -= remaining;
      remaining = 0;
    } else {
      remaining -= referralWallet;
      referralWallet = 0;
    }
  }

  // If any balance remains, throw an error
  if (remaining > 0) {
    throw new Error("Insufficient funds to complete the transaction.");
  }

  // Return updated balances and remaining combined wallet
  return {
    olympusWallet,
    olympusEarnings,
    referralWallet,
    updatedCombinedWallet: combinedWallet - amount, // Decrement combined wallet
  };
}
