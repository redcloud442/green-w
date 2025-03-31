import { WithdrawalFormValues } from "@/components/DashboardPage/DashboardWithdrawRequest/DashboardWithdrawModal/DashboardWithdrawalModalForm";
import { WithdrawalRequestData } from "@/utils/types";
import { alliance_preferred_withdrawal_table } from "@prisma/client";

export const createWithdrawalRequest = async (params: {
  WithdrawFormValues: WithdrawalFormValues;
  teamMemberId: string;
}) => {
  const { WithdrawFormValues, teamMemberId } = params;

  const data = {
    ...WithdrawFormValues,
    teamMemberId,
  };

  const response = await fetch(`/api/v1/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "An error occurred while creating the top-up request."
    );
  }

  return result;
};

export const getMemberWithdrawalRequest = async (params: {
  page: number;
  limit: number;
  search?: string;
  columnAccessor: string;
  isAscendingSort: boolean;
  userId?: string;
}) => {
  const response = await fetch(`/api/v1/withdraw/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

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
  attachments?: {
    filename: string;
    path: string;
    content_id: string;
  }[];
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

export const sendWithdrawalSMS = async (params: {
  number: string;
  message: string;
}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/message`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: params.number,
        message: params.message,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "An error occurred while sending the SMS.");
  }
};

export const getPreferredWithdrawal = async () => {
  const response = await fetch(`/api/v1/withdraw`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ||
        "An error occurred while fetching the preferred withdrawal."
    );
  }

  return result as alliance_preferred_withdrawal_table[];
};
