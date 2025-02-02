import { AdminTopUpRequestData } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAdminTopUpRequest = async (params: {
  page: number;
  limit: number;
  search?: string;
  columnAccessor: string;
  isAscendingSort: boolean;
  merchantFilter?: string;
  userFilter?: string;
  statusFilter?: string;
  dateFilter?: {
    start: string | undefined;
    end: string | undefined;
  };
}) => {
  const response = await fetch(`/api/v1/deposit/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "An error occurred while creating the top-up request."
    );
  }

  return data as AdminTopUpRequestData;
};

export const updateTopUpStatus = async (
  params: {
    status: string;
    requestId: string;
    note?: string;
  },
  supabaseClient: SupabaseClient
) => {
  const { requestId } = params;

  const response = await fetch(`/api/v1/deposit/` + requestId, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while creating the top-up request."
    );
  }

  return response as unknown as { success: boolean; balance: number };
};
