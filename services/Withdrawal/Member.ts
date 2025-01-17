import { WithdrawalFormValues } from "@/components/DashboardPage/DashboardWithdrawRequest/DashboardWithdrawModal/DashboardWithdrawalModalForm";
import { AdminWithdrawaldata, WithdrawalRequestData } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const createWithdrawalRequest = async (params: {
  WithdrawFormValues: WithdrawalFormValues;
  teamMemberId: string;
}) => {
  const { WithdrawFormValues, teamMemberId } = params;

  const data = {
    ...WithdrawFormValues,
    teamMemberId,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/withdraw`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while creating the top-up request."
    );
  }

  return result;
};

export const getMemberWithdrawalRequest = async (params: {
  page: number;
  limit: number;
  search?: string;
  teamMemberId: string;
  userId: string;
  teamId: string;
  columnAccessor: string;
  isAscendingSort: boolean;
}) => {
  const urlParams = {
    page: params.page.toString(),
    limit: params.limit.toString(),
    search: params.search || "",
    columnAccessor: params.columnAccessor,
    isAscendingSort: params.isAscendingSort ? "true" : "false",
    userId: params.userId,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/withdraw?${new URLSearchParams(urlParams)}`,
    {
      method: "GET",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the withdrawal history."
    );
  }

  return result as {
    data: WithdrawalRequestData[];
    totalCount: 0;
  };
};

export const getWithdrawalRequestAccountant = async (
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
    "get_accountant_withdrawal_history",
    {
      input_data: params,
    }
  );

  if (error) throw error;

  return data as AdminWithdrawaldata;
};

export const sendWithdrawalEmail = async (params: {
  to: string;
  from: string;
  subject: string;
  accountHolderName: string;
  accountNumber: string;
  accountType: string;
  accountBank: string;
  transactionDetails: {
    date: string;
    description: string;
    amount: string;
    balance?: string;
  };
  message: string;
  greetingPhrase: string;
  closingPhrase: string;
  signature: string;
}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/resend`,
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while sending the email."
    );
  }

  return result;
};
