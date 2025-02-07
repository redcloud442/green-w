import { chat_session_table } from "@prisma/client";

export const getChatSupportSessions = async (params: {
  page: number;
  limit: number;
}) => {
  const response = await fetch("/api/v1/chat/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch chat support sessions");
  }

  return data as {
    totalCount: number;
    data: (chat_session_table & { user_username: string })[];
  };
};

export const getChatSupportSession = async (sessionId: string) => {
  const response = await fetch(`/api/v1/chat/sessions/${sessionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch chat support session");
  }

  return data;
};

export const getChatSupportSessionAll = async () => {
  const response = await fetch(`/api/v1/chat/`, {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch chat support sessions");
  }

  return data as {
    totalCount: number;
    data: (chat_session_table & { user_username: string })[];
  };
};
