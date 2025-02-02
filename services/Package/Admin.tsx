import { package_table } from "@prisma/client";

export const getAdminPackages = async () => {
  const response = await fetch(`/api/v1/package/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while creating the top-up request."
    );
  }

  const { data } = result;

  return data as package_table[];
};

export const updatePackagesData = async (params: {
  packageData: {
    packageName: string;
    packageDescription: string;
    packagePercentage: string;
    packageDays: string;
    packageColor: string;
    packageImage: string;
    packageIsDisabled: boolean;
  };
  packageId: string;
  teamMemberId: string;
}) => {
  const { packageId } = params;

  const response = await fetch(`/api/v1/package/` + packageId, {
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

  return result;
};

export const createPackage = async (params: {
  packageName: string;
  packageDescription: string;
  packagePercentage: string;
  packageDays: string;
  packageImage: string;
  packageColor: string;
}) => {
  const response = await fetch(`/api/v1/package/create`, {
    method: "POST",
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

  const { data } = result;

  return data;
};
