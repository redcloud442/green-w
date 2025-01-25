import { escapeFormData } from "@/utils/function";
import { rateLimit } from "@/utils/redis/redis";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { createClientServerSide } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const getDirectReferralsSchema = z.object({
  page: z.string().min(1),
  limit: z.string().min(1),
  search: z.string().optional(),
  columnAccessor: z.string().min(3),
  isAscendingSort: z.string(),
});

export const GET = async (request: NextRequest) => {
  try {
    const { teamMemberProfile } = await protectionMemberUser();

    const isAllowed = await rateLimit(
      `rate-limit:${teamMemberProfile?.alliance_member_id}`,
      50,
      60
    );

    if (!isAllowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const url = new URL(request.url);

    const page = url.searchParams.get("page");
    const limit = url.searchParams.get("limit");
    const search = url.searchParams.get("search");
    const columnAccessor = url.searchParams.get("columnAccessor");
    const isAscendingSort = url.searchParams.get("isAscendingSort");

    const validate = getDirectReferralsSchema.safeParse({
      page,
      limit,
      search,
      columnAccessor,
      isAscendingSort,
    });

    if (!validate.success) {
      return NextResponse.json(
        { error: validate.error.message },
        { status: 400 }
      );
    }

    const supabaseClient = await createClientServerSide();

    if (limit !== "10") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const params = {
      page: Number(page),
      limit: Number(limit),
      search: search || "",
      columnAccessor: columnAccessor || "",
      isAscendingSort: isAscendingSort === "true",
      teamMemberId: teamMemberProfile?.alliance_member_id || "",
      teamId: teamMemberProfile?.alliance_member_alliance_id || "",
    };

    const paramsEscaped = escapeFormData(params);

    const { data, error } = await supabaseClient.rpc("get_ally_bounty", {
      input_data: paramsEscaped,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data });
  } catch (e) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
};
