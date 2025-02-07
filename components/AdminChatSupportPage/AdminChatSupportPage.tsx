"use client";

import { getChatSupportSession } from "@/services/chat/Admin";
import { socket } from "@/utils/socket";
import { alliance_member_table, chat_session_table } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import TableLoading from "../ui/tableLoading";

type ChatSupportPageProps = {
  teamMemberProfile: alliance_member_table;
};

export const AdminChatSupportPage = ({
  teamMemberProfile,
}: ChatSupportPageProps) => {
  const router = useRouter();
  const [sessions, setSessions] = useState<
    (chat_session_table & { user_username: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    const roomName = teamMemberProfile.alliance_member_alliance_id;

    socket.emit("joinWaitingRoom", roomName);
    socket.emit("fetchWaitingList", page, 10, roomName);

    socket.on("waitingList", (data) => {
      setSessions(data.data);
      setTotalCount(data.totalCount);
      setIsLoading(false);
    });

    socket.on("newQueueSession", (newSession) => {
      setSessions((prev) => [newSession, ...prev]);
    });

    return () => {
      setIsLoading(false);
      socket.off("waitingList");
      socket.off("newQueueSession");
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
      console.error("Error starting support session", e);
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
                  {session.user_username}
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
