import { escapeFormData } from "@/utils/function";
import { UserLog, UserRequestdata } from "@/utils/types";
import { user_table } from "@prisma/client";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAdminUserRequest = async (
  supabaseClient: SupabaseClient,
  params: {
    page: number;
    limit: number;
    search?: string;
    columnAccessor: string;
    isAscendingSort: boolean;
    userRole?: string;
    dateCreated?: string;
    bannedUser?: boolean;
  }
) => {
  const sanitizedData = escapeFormData(params);

  const response = await fetch(`/api/v1/user/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sanitizedData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  return data as {
    data: UserRequestdata[];
    totalCount: number;
  };
};

export const getUserWithActiveBalance = async (params: {
  teamMemberId: string;
  page: number;
  limit: number;
  search?: string;
  columnAccessor: string;
  isAscendingSort: boolean;
}) => {
  const sanitizedData = escapeFormData(params);

  const response = await fetch(`/api/v1/user/active-list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sanitizedData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  return data as {
    data: user_table[];
    totalCount: 0;
  };
};

export const getHistoryLog = async (
  supabaseClient: SupabaseClient,
  params: {
    page: number;
    limit: number;
    teamMemberId: string;
    columnAccessor: string;
    isAscendingSort: boolean;
  }
) => {
  const sanitizedData = escapeFormData(params);

  const { data, error } = await supabaseClient.rpc("get_history_log", {
    input_data: sanitizedData,
  });

  if (error) throw error;

  return data as {
    data: UserLog[];
    totalCount: 0;
  };
};

export const handleUpdateRole = async (params: {
  role: string;
  userId: string;
}) => {
  const sanitizedData = escapeFormData(params);

  const response = await fetch(`/api/v1/user/` + sanitizedData.userId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "updateRole", role: sanitizedData.role }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while updating the role."
    );
  }

  return response;
};

export const handleUpdateUserRestriction = async (params: {
  userId: string;
}) => {
  const { userId } = params;
  const response = await fetch(`/api/v1/user/` + userId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "banUser" }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while banning the user."
    );
  }

  return response;
};
