import { chat_message_table } from "@prisma/client";

export const handleMemberChat = async () => {
  const response = await fetch(`/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch member chat");
  }

  return data;
};

export const getMemberChat = async (params: { id: string }) => {
  const response = await fetch(`/api/v1/chat/${params.id}`, {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch member chat");
  }

  return data as chat_message_table[];
};
