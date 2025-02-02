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

  const response = await fetch(`/api/v1/package`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inputData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while creating the top-up request."
    );
  }

  return response;
};

export const getPackageModalData = async () => {
  const response = await fetch(`/api/v1/package`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the package modal data."
    );
  }

  const { data } = result;

  return data as package_table[];
};

export const ClaimPackageHandler = async (params: {
  packageConnectionId: string;
  earnings: number;
  amount: number;
}) => {
  const response = await fetch(`/api/v1/package/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while claiming the package."
    );
  }

  return response;
};
