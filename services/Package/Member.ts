import { PackageHistoryData } from "@/utils/types";
import { package_table } from "@prisma/client";

export const createPackageConnection = async (params: {
  packageData: { amount: number; packageId: string };
  teamMemberId: string;
}) => {
  const { packageData, teamMemberId } = params;

  const inputData = {
    ...packageData,
    teamMemberId,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/package/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inputData),
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

export const getPackageModalData = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/package/modal`,
    {
      method: "GET",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the package modal data."
    );
  }

  const { data } = result;

  return data as package_table[];
};

export const getPackageHistory = async (params: {
  search: string;
  page: number;
  limit: number;
  sortBy: boolean;
  columnAccessor: string;
  teamMemberId: string;
}) => {
  const queryParams = {
    search: params.search,
    page: params.page.toString(),
    limit: params.limit.toString(),
    sortBy: params.sortBy.toString(),
    columnAccessor: params.columnAccessor,
    teamMemberId: params.teamMemberId,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/package?${new URLSearchParams(queryParams)}`,
    {
      method: "GET",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the package history."
    );
  }

  const { data } = result;

  return data as {
    data: PackageHistoryData[];
    totalCount: number;
  };
};

export const claimPackage = async (params: {
  packageId: string;
  packageConnectionId: string;
  amount: number;
}) => {
  const { packageId, packageConnectionId, amount } = params;

  const inputData = {
    earnings: amount,
    packageId,
    packageConnectionId,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/package/${packageId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputData }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while claiming the package."
    );
  }

  return response;
};
