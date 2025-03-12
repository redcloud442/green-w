import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClientSide } from "@/utils/supabase/client";
import { useEffect, useRef, useState } from "react";

const DashboardNotification = () => {
  const [notifications, setNotifications] = useState<string[]>([]);
  const supabase = createClientSide();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current?.scrollHeight,
      behavior: "smooth",
    });
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
          console.log("📨 New Notification from Supabase:", payload);
          setNotifications((prev) => [
            ...prev,
            payload.new.package_notification_message,
          ]);

          setTimeout(() => {
            setNotifications((prev) => prev.slice(1));
          }, 10000);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
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
