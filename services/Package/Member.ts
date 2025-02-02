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

export const handleBatchPackageNotification = async (
  page: number,
  limit: number
) => {
  const response = await fetch(`/api/v1/notification/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page, limit }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the package modal data."
    );
  }

  return result as {
    userCreds: {
      user_email: string;
      user_active_mobile: string;
      team_member_id: string;
      package_connection_id: string;
      user_username: string;
    }[];
    totalCount: number;
  };
};

export const handleUpdateManyPackageMemberConnection = async (params: {
  batchData: {
    packageConnectionId: string;
    teamMemberId: string;
  }[];
}) => {
  const response = await fetch(`/api/v1/notification/batch`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ||
        "An error occurred while updating the package member connection."
    );
  }

  return response;
};
