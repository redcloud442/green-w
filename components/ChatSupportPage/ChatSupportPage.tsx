"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { escapeFormData } from "@/utils/function";
import { getSocket } from "@/utils/socket";
import { createClientSide } from "@/utils/supabase/client";
import {
  chat_message_table,
  chat_session_table,
  user_table,
} from "@prisma/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Send } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Textarea } from "../ui/textarea";

type ChatSupportPageProps = {
  session: chat_session_table;
  teamMemberId: string;
  profile: user_table;
  teamId: string;
};

export const ChatSupportPage = ({
  session,
  teamMemberId,
  profile,
  teamId,
}: ChatSupportPageProps) => {
  const router = useRouter();
  const socket = getSocket();
  const pathname = usePathname();
  const supabaseClient = createClientSide();
  const [messages, setMessages] = useState<chat_message_table[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [isWaiting, setIsWaiting] = useState(true); // For waiting status
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    socket.emit("joinRoom", { roomId: session.chat_session_id });

    socket.on("messages", (initialMessages: chat_message_table[]) => {
      setMessages(initialMessages);
      scrollToBottom();
    });

    const handleNewMessage = (message: chat_message_table) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("messages");
      socket.off("joinRoom");
      socket.off("newMessage", handleNewMessage);
    };
  }, [session.chat_session_id]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      chat_message_content: newMessage,
      chat_message_session_id: session.chat_session_id,
      chat_message_alliance_member_id: teamMemberId,
      chat_message_date: new Date().toISOString(),
      chat_message_sender_user: profile.user_username,
    };

    socket.emit("sendMessage", message);
    setNewMessage("");
    scrollToBottom();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const handleEndSupport = () => {
      const message = {
        chat_message_content: "Support session ended",
        chat_message_session_id: session.chat_session_id,
        chat_message_alliance_member_id: teamMemberId,
        chat_message_date: new Date().toISOString(),
        chat_message_sender_user: profile.user_username,
      };

      const data = escapeFormData(message);
      socket.emit("sendMessage", data);
    };

    window.addEventListener("beforeunload", handleEndSupport);
    window.addEventListener("pagehide", handleEndSupport);

    // Trigger end support if leaving the chat page
    if (pathname && pathname !== "/chat-support") {
      handleEndSupport();
    }

    return () => {
      window.removeEventListener("beforeunload", handleEndSupport);
      window.removeEventListener("pagehide", handleEndSupport);
    };
  }, [pathname, session.chat_session_id, teamMemberId, profile.user_username]);

  useEffect(() => {
    scrollToBottom();
  }, []);

  useEffect(() => {
    const subscription: RealtimeChannel = supabaseClient
      .channel("chat_sessions")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "chat_schema",
          table: "chat_session_table",
        },
        (payload) => {
          console.log("Session update received:", payload);

          // Handle only status changes
          if (payload.new.chat_session_status === "SUPPORT ONGOING") {
            setIsWaiting(false);
          } else if (payload.new.chat_session_status === "SUPPORT ENDED") {
            setIsEnding(true);
            setTimeout(() => {
              router.push("/");
              setIsEnding(false);
            }, 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="flex flex-col h-full border-2">
      {isEnding && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-2xl font-bold">
            Support session ended. Redirecting to home...
          </div>
        </div>
      )}

      {isWaiting ? (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <h2 className="text-2xl font-bold text-gray-600">
            Waiting for an admin to accept the session{" "}
            <span className="animate-pulse transition-all duration-500">.</span>
            <span className="animate-pulse transition-all duration-800">.</span>
            <span className="animate-pulse transition-all duration-1000">
              .
            </span>
          </h2>
        </div>
      ) : (
        <>
          <div className="p-4 border-b bg-cyan-400 shadow">
            <h2 className="text-2xl font-bold ">{`Chat - SUPPORT ONGOING`}</h2>
          </div>

          {/* Chat messages */}
          <div className="space-y-4">
            <ScrollArea className="flex-1 h-[500px] sm:h-[970px] p-4 bg-gray-200 space-y-4 border-2">
              {messages.map((message, index) => (
                <div
                  key={
                    message.chat_message_id ||
                    message.chat_message_date.toString()
                  }
                  ref={index + 1 === messages.length ? chatContainerRef : null}
                  className={`flex items-end space-x-3 gap-2 my-2 ${
                    message.chat_message_alliance_member_id === teamMemberId
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {message.chat_message_alliance_member_id !== teamMemberId && (
                    <Avatar>
                      <AvatarImage src={profile.user_profile_picture ?? ""} />
                      <AvatarFallback>
                        {message.chat_message_sender_user
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <Card
                    className={`p-3 max-w-xs rounded-lg ${
                      message.chat_message_alliance_member_id === teamMemberId
                        ? "bg-blue-100 text-right"
                        : "bg-white"
                    }`}
                  >
                    <p className="text-sm font-bold">
                      {message.chat_message_sender_user}
                    </p>
                    <p className="text-gray-700 break-words">
                      {message.chat_message_content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(message.chat_message_date).toLocaleTimeString()}
                    </p>
                  </Card>
                  {message.chat_message_alliance_member_id === teamMemberId && (
                    <Avatar>
                      <AvatarImage src={profile.user_profile_picture ?? ""} />
                      <AvatarFallback>
                        {profile.user_username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </ScrollArea>
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex items-center space-x-3">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 "
              />
              <Button onClick={sendMessage} variant="default" className="p-2">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
