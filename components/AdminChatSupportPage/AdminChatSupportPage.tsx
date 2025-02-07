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
  const socketIo = socket;
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border-2 p-4">
      <h1 className="text-2xl font-bold mb-4">Active Chat Support Sessions</h1>
      {isLoading && <TableLoading />}

      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">
              Requesting User
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Status
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Created At
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr
              key={session.chat_session_id}
              className="odd:bg-white even:bg-gray-50"
            >
              <td className="border border-gray-300 px-4 py-2">
                {session.user_username}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {session.chat_session_status}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {new Date(session.chat_session_date).toLocaleString()}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <Button
                  onClick={() => handleSupportChat(session.chat_session_id)}
                  variant="card"
                >
                  Support Chat
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className={`px-4 py-2 border rounded ${
            page === 1 ? "bg-gray-300 text-gray-500" : "bg-blue-500 text-white"
          }`}
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.ceil(totalCount / 10)}
        </span>
        <button
          onClick={handleNextPage}
          disabled={page * 10 >= totalCount}
          className={`px-4 py-2 border rounded ${
            page * 10 >= totalCount
              ? "bg-gray-300 text-gray-500"
              : "bg-blue-500 text-white"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};
