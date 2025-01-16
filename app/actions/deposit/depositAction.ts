"use server";

import { TopUpFormValues } from "@/components/DashboardPage/DashboardDepositRequest/DashboardDepositModal/DashboardDepositModalDeposit";
import { applyRateLimitMember } from "@/utils/function";
import prisma from "@/utils/prisma";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { createClientServerSide } from "@/utils/supabase/server";
import { z } from "zod";

const topUpFormSchema = z.object({
  amount: z
    .string()
    .min(3, "Amount is required and must be at least 300 pesos")
    .max(6, "Amount must be less than 6 digits")
    .regex(/^\d+$/, "Amount must be a number")
    .refine((amount) => parseInt(amount, 10) >= 300, {
      message: "Amount must be at least 300 pesos",
    }),
  topUpMode: z.string().min(1, "Top up mode is required"),
  accountName: z.string().min(1, "Field is required"),
  accountNumber: z.string().min(1, "Field is required"),
  file: z
    .instanceof(File)
    .refine((file) => !!file, { message: "File is required" })
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/jpg"].includes(file.type) &&
        file.size <= 12 * 1024 * 1024, // 12MB limit
      { message: "File must be a valid image and less than 12MB." }
    ),
});

export const depositWalletData = async (params: {
  TopUpFormValues: TopUpFormValues;
  publicUrl: string;
}) => {
  const publicUrl = params.publicUrl;
  const supabase = await createClientServerSide();
  try {
    const sanitizedData = topUpFormSchema.safeParse(params.TopUpFormValues);

    if (!sanitizedData.success) {
      throw new Error("Invalid Request.");
    }

    const { teamMemberProfile } = await protectionMemberUser();

    if (!teamMemberProfile?.alliance_member_id) {
      throw new Error("Member ID is required");
    }

    await applyRateLimitMember(teamMemberProfile.alliance_member_id);

    const { amount, topUpMode, accountName, accountNumber } =
      params.TopUpFormValues;

    if (!amount || !topUpMode || !accountName || !accountNumber || !publicUrl) {
      throw new Error("All fields are required.");
    }

    if (amount.length > 7 || amount.length < 3) {
      throw new Error("Invalid Request.");
    }

    if (parseInt(amount, 10) < 300) {
      throw new Error("Invalid Request.");
    }

    const merchantData = await prisma.merchant_table.findFirst({
      where: {
        merchant_account_name: accountName,
        merchant_account_number: accountNumber,
      },
      select: {
        merchant_account_name: true,
        merchant_account_number: true,
        merchant_account_type: true,
      },
    });

    if (!merchantData) {
      throw new Error("Invalid Request.");
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.alliance_top_up_request_table.create({
          data: {
            alliance_top_up_request_amount: Number(amount),
            alliance_top_up_request_type: topUpMode,
            alliance_top_up_request_name: accountName,
            alliance_top_up_request_account: accountNumber,
            alliance_top_up_request_attachment: publicUrl,
            alliance_top_up_request_member_id:
              teamMemberProfile.alliance_member_id,
          },
        });
        await tx.alliance_transaction_table.create({
          data: {
            transaction_amount: Number(amount),
            transaction_description: "Deposit Pending",
            transaction_member_id: teamMemberProfile.alliance_member_id,
          },
        });
      });

      return { success: true };
    } catch (dbError) {
      throw new Error("Internal Server Error.");
    }
  } catch (error) {
    await supabase.storage.from("REQUEST_ATTACHMENTS").remove([publicUrl]);
    throw new Error("Internal Server Error.");
  }
};
