import { MerchantTopUpRequestData, TopUpRequestData } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getMemberTopUpRequest = async (params: {
  page: number;
  limit: number;
  search?: string;
  columnAccessor: string;
  isAscendingSort: boolean;
  teamMemberId?: string;
  userId?: string;
}) => {
  const queryParams = {
    search: params.search || "",
    page: params.page.toString(),
    limit: params.limit.toString(),
    columnAccessor: params.columnAccessor,
    isAscendingSort: params.isAscendingSort.toString(),
    userId: params.userId || "",
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/top-up?${new URLSearchParams(queryParams)}`,
    {
      method: "GET",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the top-up history."
    );
  }

  const { data } = result;

  return data as {
    data: TopUpRequestData[];
    totalCount: 0;
  };
};

export const updateTopUpStatus = async (params: {
  status: string;
  requestId: string;
}) => {
  const { requestId } = params;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/top-up/` + requestId,
    {
      method: "PUT",
      body: JSON.stringify(params),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while creating the top-up request."
    );
  }

  return response;
};

export const getMerchantTopUpRequest = async (
  supabaseClient: SupabaseClient,
  params: {
    page: number;
    limit: number;
    search?: string;
    teamMemberId: string;
    teamId: string;
    columnAccessor: string;
    isAscendingSort: boolean;
    userFilter?: string;
    statusFilter?: string;
    dateFilter?: {
      start: string | undefined;
      end: string | undefined;
    };
  }
) => {
  const { data, error } = await supabaseClient.rpc(
    "get_merchant_top_up_history",
    {
      input_data: params,
    }
  );

  if (error) throw error;

  return data as MerchantTopUpRequestData;
};
