import { applyRateLimit, escapeFormData } from "@/utils/function";
import prisma from "@/utils/prisma";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { createClientServerSide } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
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
    const isAscendingSort = url.searchParams.get("isAscendingSort") || true;
    const teamMemberId = url.searchParams.get("teamMemberId") || "";

    const params = {
      search,
      page,
      limit,
      sortBy,
      columnAccessor,
      isAscendingSort: isAscendingSort,
      teamId: teamMemberProfile?.alliance_member_alliance_id || "",
      teamMemberId: teamMemberId
        ? teamMemberId
        : teamMemberProfile?.alliance_member_id,
    };

    const escapedParams = escapeFormData(params);

    if (limit !== "10") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { data, error } = await supabaseClient.rpc(
      "get_member_top_up_history",
      {
        input_data: escapedParams,
      }
    );

    if (error) throw error;

    return NextResponse.json({ success: true, data: data });
  } catch (error) {
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Retrieve the IP address
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const supabase = await createClientServerSide();

    const formData = await request.formData();

    const {
      amount,
      topUpMode,
      accountName,
      accountNumber,
      file,
      teamMemberId,
    } = Object.fromEntries(formData) as {
      amount?: string;
      topUpMode?: string;
      accountName?: string;
      accountNumber?: string;
      file?: File;
      teamMemberId?: string;
    };
    if (
      !amount ||
      !topUpMode ||
      !accountName ||
      !accountNumber ||
      !file ||
      !teamMemberId
    ) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (Math.floor(Number(amount)) > 7 || Math.floor(Number(amount)) < 3) {
      return NextResponse.json({ error: "Invalid Request." }, { status: 400 });
    }

    if (parseInt(amount, 10) < 200) {
      return NextResponse.json({ error: "Invalid Request." }, { status: 400 });
    }

    await protectionMemberUser(ip);
    await applyRateLimit(teamMemberId, ip);

    const merchantData = await prisma.merchant_table.findFirst({
      where: {
        merchant_account_name: accountName,
        merchant_account_number: accountNumber,
        merchant_account_type: topUpMode,
      },
    });

    if (!merchantData) {
      return NextResponse.json({ error: "Invalid Request." }, { status: 404 });
    }

    const filePath = `uploads/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("REQUEST_ATTACHMENTS")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return NextResponse.json(
        { error: "File upload failed.", details: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("REQUEST_ATTACHMENTS").getPublicUrl(filePath);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.alliance_top_up_request_table.create({
          data: {
            alliance_top_up_request_amount: Number(amount),
            alliance_top_up_request_type: topUpMode,
            alliance_top_up_request_name: accountName,
            alliance_top_up_request_account: accountNumber,
            alliance_top_up_request_attachment: publicUrl,
            alliance_top_up_request_member_id: teamMemberId,
          },
        });
        await tx.alliance_transaction_table.create({
          data: {
            transaction_amount: Number(amount),
            transaction_description: "Deposit Ongoing",
            transaction_member_id: teamMemberId,
          },
        });
      });

      return NextResponse.json({ success: true });
    } catch (dbError) {
      await supabase.storage.from("REQUEST_ATTACHMENTS").remove([filePath]);
      return NextResponse.json(
        { error: "Internal Server Error." },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
