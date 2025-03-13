import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClientSide } from "@/utils/supabase/client";
import { useEffect, useRef, useState } from "react";

const DashboardNotification = () => {
  const [notifications, setNotifications] = useState<
    { id: string; message: string }[]
  >([]);
  const [isFull, setIsFull] = useState(false);
  const [fading, setFading] = useState<string[]>([]); // Track fading notifications
  const supabase = createClientSide();
  const containerRef = useRef<HTMLDivElement>(null);

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
          setNotifications((prev) => {
            const newNotifications = [
              ...prev,
              {
                id: payload.new.package_notification_id,
                message: payload.new.package_notification_message,
              },
            ];

            if (newNotifications.length >= 5) {
              setIsFull(true);
            }

            return newNotifications.slice(-5); // Keep the latest 5 notifications
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Remove notifications one by one after 10 seconds (only when count reaches 5)
  useEffect(() => {
    if (isFull && notifications.length === 5) {
      const interval = setInterval(() => {
        const oldestNotification = notifications[0];

        if (oldestNotification) {
          setFading((prev) => [...prev, oldestNotification.id]); // Mark the oldest one to fade

          setTimeout(() => {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== oldestNotification.id)
            ); // Remove it after fade
            setFading((prev) =>
              prev.filter((id) => id !== oldestNotification.id)
            ); // Clear fade tracking
          }, 10000); // 10-second fade duration
        }
      }, 5000); // Start fading a new notification every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isFull, notifications]);

  const scrollToBottom = (container: HTMLElement | null, smooth = false) => {
    if (container?.children.length) {
      const lastElement = container?.lastChild as HTMLElement;

      lastElement?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
        inline: "nearest",
      });
    }
  };

  useEffect(() => {
    scrollToBottom(containerRef.current, true);
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
