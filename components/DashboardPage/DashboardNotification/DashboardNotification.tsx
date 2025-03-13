import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClientSide } from "@/utils/supabase/client";
import { useEffect, useRef, useState } from "react";

const DashboardNotification = () => {
  const [notifications, setNotifications] = useState<
    { id: string; message: string }[]
  >([]);
  const [isFull, setIsFull] = useState(false);
  const [fading, setFading] = useState<string[]>([]);
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
              setIsFull(true); // Mark that we reached 5 notifications
            }

            return newNotifications.slice(-5); // Always keep the latest 5
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isFull && notifications.length === 5) {
      const interval = setInterval(() => {
        setFading((prev) => [...prev, notifications[0].id]); // Mark oldest as fading

        setTimeout(() => {
          setNotifications((prev) => prev.slice(1)); // Remove after fade-out
          setFading((prev) => prev.slice(1)); // Clear fade tracking
        }, 1000); // Fade out before removal
      }, 2000); // Remove one every 4 seconds

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
                "text-black text-center text-[12px] sm:text-sm rounded-lg w-full transition-opacity duration-2000",
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
              animation: fadeOut 2s ease-in-out forwards;
            }
          `}
          </style>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DashboardNotification;
