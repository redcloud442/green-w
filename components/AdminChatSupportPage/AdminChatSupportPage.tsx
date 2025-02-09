"use client";

import { getChatSupportSession } from "@/services/chat/Admin";
import { socket } from "@/utils/socket";
import { chat_session_table } from "@prisma/client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import TableLoading from "../ui/tableLoading";

export const AdminChatSupportPage = () => {
  const router = useRouter();
  const supabaseClient = createClientComponentClient();
  const [sessions, setSessions] = useState<chat_session_table[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      const { data, error, count } = await supabaseClient
        .schema("chat_schema")
        .from("chat_session_table")
        .select("*", { count: "exact" })
        .eq("chat_session_status", "WAITING FOR SUPPORT")
        .range((page - 1) * 10, page * 10 - 1);

      if (error) {
        console.error("Error fetching sessions", error);
      } else {
        setSessions(data || []);
        setTotalCount(count || 0);
      }
      setIsLoading(false);
    };

    fetchSessions();

    const subscription: RealtimeChannel = supabaseClient
      .channel("chat_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "chat_schema",
          table: "chat_session_table",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSessions((prev) => [...prev, payload.new as chat_session_table]);
          } else if (payload.eventType === "UPDATE") {
            setSessions((prev) =>
              prev.map((session) =>
                session.chat_session_id === payload.new.chat_session_id
                  ? (payload.new as chat_session_table)
                  : session
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(subscription);
    };
  }, [page]);

  const handleNextPage = () => {
    if (page * 10 < totalCount) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleSupportChat = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const data = await getChatSupportSession(sessionId);

      if (data) {
        socket.emit("acceptSupportSession", { sessionId });

        router.push(`/admin/chat-support/${sessionId}`);
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">
        Active Chat Support Sessions
      </h1>
      {isLoading && <TableLoading />}

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-blue-100">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                Requesting User
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, index) => (
              <tr
                key={session.chat_session_id}
                className={`${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50`}
              >
                <td className="px-6 py-4 text-sm text-gray-700">
                  ID-{session.chat_session_alliance_member_id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {session.chat_session_status}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(session.chat_session_date).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <Button
                    onClick={() => handleSupportChat(session.chat_session_id)}
                    className="bg-blue-500 text-white hover:bg-blue-600 rounded-md px-4 py-2"
                  >
                    Support Chat
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <Button
          onClick={handlePrevPage}
          disabled={page === 1}
          className={`px-4 py-2 rounded ${
            page === 1
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-600">
          Page {page} of {Math.ceil(totalCount / 10)}
        </span>
        <Button
          onClick={handleNextPage}
          disabled={page * 10 >= totalCount}
          className={`px-4 py-2 rounded ${
            page * 10 >= totalCount
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
