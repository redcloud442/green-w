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

export const ChatSupportPage = ({
  session,
  teamMemberId,
  profile,
}: ChatSupportPageProps) => {
  const socketWebsocket = socket;
  const [messages, setMessages] = useState<chat_message_table[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    socketWebsocket.emit("joinRoom", session.chat_session_id);

    // Fetch previous messages
    socketWebsocket.on("messages", (initialMessages: chat_message_table[]) => {
      setMessages(initialMessages);
      scrollToBottom(); // Scroll to the bottom after loading messages
    });

    // Listen for new messages
    socketWebsocket.on("newMessage", (message: chat_message_table) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    // Cleanup on component unmount
    return () => {
      socketWebsocket.off("messages");
      socketWebsocket.off("newMessage");
    };
  }, [session.chat_session_id]);

  // Automatically scroll to the bottom when messages are updated
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    };

    socketWebsocket.emit("sendMessage", message);

    // Optimistically update the UI
    setMessages((prev) => [...prev, message as unknown as chat_message_table]);
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
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full border-2">
      {/* Header */}

      <div className="p-4 border-b bg-white shadow">
        <h2 className="text-2xl font-bold">
          {`Chat - ${session.chat_session_status}`}
        </h2>
      </div>

      {/* Chat messages */}

      <div className="space-y-4">
        <ScrollArea
          className="flex-1 h-[970px] p-4 bg-cyan-300/80 space-y-4 border-2"
          ref={scrollRef}
        >
          {messages.map((message) => (
            <div
              key={
                message.chat_message_id || message.chat_message_date.toString()
              }
              className={`flex items-end space-x-3 gap-2 ${
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
                <p className="text-gray-700">{message.chat_message_content}</p>
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

      {/* Message input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border-white text-white placeholder:text-white"
          />
          <Button onClick={sendMessage} variant="default" className="p-2">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
