import { alliance_notification_table } from "@prisma/client";

export const handleFetchMemberNotification = async (params: {
  take: number;
}) => {
  const response = await fetch(`/api/v1/notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch member notification");
  }

  const data = responseData.data;

  return data as {
    notifications: alliance_notification_table[];
    total: number;
  };
};

export const handleUpdateMemberNotification = async (params: {
  take: number;
}) => {
  const response = await fetch(`/api/v1/notification`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch member notification");
  }

  const data = responseData.data;

  console.log(data);

  return data;
};
