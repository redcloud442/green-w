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
    page: params.page.toString(),
    limit: params.limit.toString(),
    search: params.search || "",
    columnAccessor: params.columnAccessor,
    isAscendingSort: params.isAscendingSort.toString(),
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/referrals/direct?${new URLSearchParams(urlParams)}`,
    {
      method: "GET",
    }
  );

  const result = await response.json();

  if (!response.ok) throw new Error(result.error);

  const { data } = result;

  return data as {
    data: (user_table & { total_bounty_earnings: string })[];
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
  userId: string;
}) => {
  const urlParams = {
    page: params.page.toString(),
    limit: params.limit.toString(),
    search: params.search || "",
    columnAccessor: params.columnAccessor,
    isAscendingSort: params.isAscendingSort.toString(),
    userId: params.userId,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/referrals/indirect?${new URLSearchParams(urlParams)}`,
    {
      method: "GET",
    }
  );

  const result = await response.json();

  if (!response.ok) throw new Error(result.error);

  const { data } = result;

  return data as {
    data: LegionRequestData[];
    totalCount: 0;
  };
};
