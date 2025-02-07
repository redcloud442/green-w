"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { socket } from "@/utils/socket";
import {
  chat_message_table,
  chat_session_table,
  user_table,
} from "@prisma/client";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Textarea } from "../ui/textarea";

type ChatSupportPageProps = {
  session: chat_session_table;
  teamMemberId: string;
  profile: user_table;
};

export const AdminChatSupportSessionPage = ({
  session,
  teamMemberId,
  profile,
}: ChatSupportPageProps) => {
  const socketWebsocket = socket;
  const [messages, setMessages] = useState<chat_message_table[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    socketWebsocket.emit(
      "joinRoom",
      session.chat_session_id,
      profile.user_username,
      teamMemberId
    );

    socketWebsocket.on("messages", (initialMessages: chat_message_table[]) => {
      setMessages(initialMessages);
      scrollToBottom();
    });

    const handleNewMessage = (message: chat_message_table) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    };

    socketWebsocket.on("newMessage", handleNewMessage);

    return () => {
      socketWebsocket.off("messages");
      socketWebsocket.off("newMessage", handleNewMessage);
    };
  }, [session.chat_session_id]);

  // Automatically scroll to the bottom when messages are updated
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Send a new message to the server
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      chat_message_content: newMessage,
      chat_message_session_id: session.chat_session_id,
      chat_message_alliance_member_id: teamMemberId,
      chat_message_date: new Date().toISOString(),
      chat_message_sender_user: profile.user_username,
    };

    socketWebsocket.emit("sendMessage", message);
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
    if (messages.length > 0 && chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleEndSupport = () => {
    try {
      socketWebsocket.emit(
        "endSupport",
        session.chat_session_id,
        profile.user_username
      );

      setMessages((prev) => [
        ...prev,
        {
          chat_message_id: crypto.randomUUID(),
          chat_message_content: "Session Support Ended",
          chat_message_date: new Date(),
          chat_message_session_id: session.chat_session_id,
          chat_message_alliance_member_id: teamMemberId,
          chat_message_sender_user: profile.user_username,
        },
      ]);
    } catch (error) {}
  };

  return (
    <div className="flex flex-col h-full ">
      {/* Header */}
      <div>
        <div className="p-4 border-b bg-white shadow flex justify-between">
          <h2 className="text-2xl font-bold">
            {`Chat - ${session.chat_session_status}`}
          </h2>
          <Button
            variant="card"
            className="ml-4 rounded-md"
            onClick={handleEndSupport}
          >
            End Support
          </Button>
        </div>

        {/* Chat messages */}

        <div className="space-y-4">
          <ScrollArea className="flex-1 h-[970px] p-4 bg-white space-y-4 border-2">
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
                      {profile.user_username.charAt(0).toUpperCase()}
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
                  <p className="text-gray-700 break-words ">
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
                {message.chat_message_content === "Session Support Ended" && (
                  <div className="text-red-500 text-center">
                    <p>Session Support Ended</p>
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>

        {session.chat_session_status === "SUPPORT ONGOING" && (
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
        )}
      </div>
    </div>
  );
};
