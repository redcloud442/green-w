import { LegionRequestData } from "@/utils/types";
import { user_table } from "@prisma/client";

export const getAllyBounty = async (params: {
  page: number;
  limit: number;
  search?: string;
  columnAccessor: string;
  isAscendingSort: boolean;
}) => {
  const urlParams = {
    page: params.page,
    limit: params.limit,
    search: params.search || "",
    columnAccessor: params.columnAccessor,
    isAscendingSort: params.isAscendingSort,
  };

  const response = await fetch(`/api/v1/referral/direct`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(urlParams),
  });

  const result = await response.json();

  if (!response.ok) throw new Error(result.error);

  return result as {
    data: (user_table & {
      total_bounty_earnings: string;
      package_ally_bounty_log_date_created: string;
    })[];
    totalCount: 0;
  };
};

export const getLegionBounty = async (params: {
  page: number;
  limit: number;
  search?: string;
  teamMemberId: string;
  columnAccessor: string;
  isAscendingSort: boolean;
}) => {
  const urlParams = {
    page: params.page,
    limit: params.limit,
    search: params.search || "",
    columnAccessor: params.columnAccessor,
    isAscendingSort: params.isAscendingSort,
  };

  const response = await fetch(`/api/v1/referral/indirect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(urlParams),
  });

  const result = await response.json();

  if (!response.ok) throw new Error(result.error);

  return result as {
    data: LegionRequestData[];
    totalCount: 0;
  };
};
