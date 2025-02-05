import { DashboardEarnings } from "@/utils/types";
import {
  alliance_earnings_table,
  alliance_ranking_table,
} from "@prisma/client";

export const getUserSponsor = async (params: { userId: string }) => {
  const response = await fetch(`/api/v1/user/sponsor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the earnings."
    );
  }

  return result as string;
};

export const getUserEarnings = async (params: { memberId: string }) => {
  const response = await fetch(`/api/v1/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the earnings."
    );
  }

  return result as {
    totalEarnings: DashboardEarnings;
    userEarningsData: alliance_earnings_table;
    userRanking: alliance_ranking_table;
  };
};

export const getUserWithdrawalToday = async () => {
  const response = await fetch(`/api/v1/user`, {
    method: "GET",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the withdrawal."
    );
  }

  return result as {
    canWithdrawReferral: boolean;
    canUserDeposit: boolean;
    canWithdrawPackage: boolean;
  };
};

export const changeUserPassword = async (params: {
  userId: string;
  email: string;
  password: string;
}) => {
  const response = await fetch(
    `/api/v1/user/` + params.userId + `/change-password`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while changing the password."
    );
  }

  return result;
};

export const updateUserProfile = async (params: {
  userId: string;
  profilePicture: string;
}) => {
  const response = await fetch(`/api/v1/user/` + params.userId, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while updating the profile."
    );
  }

  return result;
};

export const handleGenerateLink = async (params: {
  formattedUserName: string;
}) => {
  const response = await fetch(`/api/v1/user/generate-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while generating the link."
    );
  }

  return result;
};

export const handleUpdateUserField = async (params: {
  userId: string;
  type: string;
  value: string;
}) => {
  const response = await fetch(
    `/api/v1/user/` + params.userId + `/update-profile`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while updating the profile."
    );
  }

  return result;
};
