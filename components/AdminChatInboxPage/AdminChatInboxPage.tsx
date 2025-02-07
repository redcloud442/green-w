"use client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getChatSupportSessionAll } from "@/services/chat/Admin";
import { socket } from "@/utils/socket";
import {
  alliance_member_table,
  chat_message_table,
  chat_session_table,
} from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "../ui/skeleton";

type AdminChatInboxPageProps = {
  teamMemberProfile: alliance_member_table;
  userUsername: string;
};

const AdminChatInboxPage = ({
  teamMemberProfile,
  userUsername,
}: AdminChatInboxPageProps) => {
  const [sessions, setSessions] = useState<
    (chat_session_table & { user_username: string })[]
  >([]);
  const [selectedSession, setSelectedSession] = useState<
    (chat_session_table & { user_username: string }) | null
  >(null);
  const [messages, setMessages] = useState<chat_message_table[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);

  const handleFetchSessions = async () => {
    try {
      setIsLoading(true);
      const data = await getChatSupportSessionAll();
      setSessions(data.data);
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchSessions();
  }, []);

  const selectSession = (
    session: chat_session_table & { user_username: string }
  ) => {
    setSelectedSession(session);
    socket.emit("joinRoom", session.chat_session_id);
    setIsFetchingMessages(true);
    socket.on("messages", (initialMessages: chat_message_table[]) => {
      setMessages(initialMessages);
    });
    setIsFetchingMessages(false);
    setShowChat(true);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-3">
      {/* Left Side - Sessions List */}
      <div
        className={`col-span-1 border-r border-gray-300 p-4 bg-white md:block ${
          showChat ? "hidden" : "block"
        }`}
      >
        <h2 className="text-xl font-bold mb-4">Chat Sessions</h2>
        <ScrollArea className="h-[600px] sm:h-[1000px] space-y-2 p-2">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-[100px] w-full" />
              <Skeleton className="h-[100px] w-full" />
              <Skeleton className="h-[100px] w-full" />
              <Skeleton className="h-[100px] w-full" />
            </div>
          )}

          {sessions.map((session) => (
            <div
              key={session.chat_session_id}
              onClick={() => selectSession(session)}
              className={`p-3 rounded-lg cursor-pointer bg-gray-200 hover:bg-blue-100 ${
                selectedSession?.chat_session_id === session.chat_session_id
                  ? "bg-blue-200"
                  : ""
              }`}
            >
              <p className="font-semibold">{session.chat_session_status}</p>
              <p className="font-semibold">Username: {session.user_username}</p>
              <p className="text-sm text-gray-600">
                {new Date(session.chat_session_date).toLocaleString()}
              </p>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Right Side - Chat Window */}
      <div
        className={`col-span-2 flex flex-col ${
          showChat ? "block" : "hidden md:block"
        }`}
      >
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-blue-500 text-white flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Chat - {selectedSession.chat_session_status}
              </h2>
              <Button
                variant="default"
                className="md:hidden"
                onClick={() => setShowChat(false)}
              >
                Back
              </Button>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="h-[600px] sm:h-[1230px] p-2 space-y-4 bg-gray-100">
              {messages.map((message, index) => (
                <div
                  key={index}
                  ref={index + 1 === messages.length ? chatContainerRef : null}
                  className={`flex space-x-2 my-2 ${
                    message.chat_message_alliance_member_id ===
                    teamMemberProfile.alliance_member_id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[80%] text-sm md:text-base break-words shadow-md ${
                      message.chat_message_alliance_member_id ===
                      teamMemberProfile.alliance_member_id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    <p className="font-bold">
                      {message.chat_message_alliance_member_id ===
                      teamMemberProfile.alliance_member_id
                        ? userUsername
                        : selectedSession.user_username}
                    </p>
                    <p>{message.chat_message_content}</p>
                    <p
                      className={`text-xs  mt-1 ${
                        message.chat_message_alliance_member_id ===
                        teamMemberProfile.alliance_member_id
                          ? "text-gray-200"
                          : "text-gray-500"
                      }`}
                    >
                      {new Date(message.chat_message_date).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatContainerRef}></div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <p className="text-xl text-gray-500">
              Select a session to see history
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatInboxPage;
