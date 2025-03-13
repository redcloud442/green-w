import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClientSide } from "@/utils/supabase/client";
import { useEffect, useRef, useState } from "react";

const DashboardNotification = () => {
  const [notifications, setNotifications] = useState<
    { id: string; message: string }[]
  >([]);
  const [fading, setFading] = useState<string[]>([]); // Track fading notifications
  const supabase = createClientSide();
  const containerRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef(notifications);

  // Update ref when notifications change
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime:package_notification")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "packages_schema",
          table: "package_notification_table",
        },
        (payload) => {
          setNotifications((prev) => [
            ...prev,
            {
              id: payload.new.package_notification_id,
              message: payload.new.package_notification_message,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Start fading notifications after 10 seconds, remove after fade (5s)
  useEffect(() => {
    if (notificationsRef.current.length >= 5) {
      const interval = setInterval(() => {
        const oldestNotification = notificationsRef.current[0];

        if (oldestNotification) {
          setFading((prev) => [...prev, oldestNotification.id]);

          setTimeout(() => {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== oldestNotification.id)
            );
            setFading((prev) =>
              prev.filter((id) => id !== oldestNotification.id)
            );
          }, 5000);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [notifications.length >= 5]);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [notifications]);

  return (
    <div className="mt-24 flex flex-col justify-center items-center gap-2 z-50 mx-2">
      <ScrollArea
        className={cn(
          "border-2 lg:h-40 h-32 m-4 p-2 rounded-lg w-full max-w-xl lg:max-w-3xl",
          "flex flex-col-reverse justify-start items-center"
        )}
      >
        <div className="flex flex-col justify-end h-auto" ref={containerRef}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "text-black text-center text-[12px] sm:text-sm rounded-lg w-full transition-opacity duration-5000",
                fading.includes(notification.id)
                  ? "opacity-0 animate-fadeOut"
                  : "opacity-100",
                "flex flex-col space-y-2"
              )}
            >
              📢 {notification.message} 📢
            </div>
          ))}
          <style>
            {`
            @keyframes fadeOut {
              0% { opacity: 1; }
              100% { opacity: 0; }
            }
            .animate-fadeOut {
              animation: fadeOut 5s ease-in-out forwards;
            }
          `}
          </style>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DashboardNotification;
