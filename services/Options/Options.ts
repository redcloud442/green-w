import { merchant_table, user_table } from "@prisma/client";

export const getUserOptionsMerchant = async (params: {
  page: number;
  limit: number;
}) => {
  const response = await fetch(`/api/v1/options/merchant-options`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch user options");
  }

  return data as user_table[];
};

export const getUserOptions = async (params: {
  page: number;
  limit: number;
}) => {
  const response = await fetch(`/api/v1/options/user-options`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch user options");
  }

  return data as user_table[];
};

export const getMerchantOptions = async () => {
  const response = await fetch(`/api/v1/merchant`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch merchant options");
  }

  const result = await response.json();

  const { data } = result;

  return data as merchant_table[];
};
