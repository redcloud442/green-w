import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const DashboardNotification = () => {
  const [notifications, setNotifications] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({
      top: containerRef.current?.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [notifications]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectInterval = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const socket = new WebSocket(
      `${process.env.NODE_ENV === "development" ? "ws://localhost:3000" : "wss://elevateglobal.app"}/ws`
    );
    socketRef.current = socket;

    socket.onopen = () => {
      if (reconnectInterval.current) {
        clearInterval(reconnectInterval.current);
        reconnectInterval.current = null; // Stop reconnection attempts when connected
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "package-purchased") {
        setNotifications((prev) => [...prev, data.data]);
        setTimeout(() => {
          setNotifications((prev) => prev.slice(1)); // Remove oldest notification
        }, 10000);
      }
    };

    socket.onclose = () => {
      if (!reconnectInterval.current) {
        reconnectInterval.current = setInterval(() => {
          connectWebSocket();
        }, 5000);
      }
    };

    socket.onerror = (error) => {};
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectInterval.current) {
        clearInterval(reconnectInterval.current);
      }
    };
  }, []);
  return (
    <div className="mt-24 flex flex-col justify-center items-center gap-2 z-50 mx-2">
      <ScrollArea
        className={cn(
          "border-2 lg:h-40 h-32 m-4 rounded-lg w-full max-w-lg lg:max-w-3xl",
          "flex flex-col-reverse justify-start items-center p-2"
        )}
        ref={containerRef}
      >
        <div className="flex flex-col justify-end p-2 h-auto">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={cn(
                "text-black text-center text-[9px] sm:text-sm rounded-lg w-full",
                "opacity-100 transition-opacity duration-10000 animate-fadeOut",
                "flex flex-col space-y-2"
              )}
            >
              📢 {notification} 📢
            </div>
          ))}
          <style>
            {`
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fadeOut {
          animation: fadeOut 10s ease-in-out forwards;
        }
      `}
          </style>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DashboardNotification;
