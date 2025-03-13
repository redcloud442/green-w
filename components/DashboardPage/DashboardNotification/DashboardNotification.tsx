import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClientSide } from "@/utils/supabase/client";
import { useEffect, useRef, useState } from "react";

const DashboardNotification = () => {
  const [notifications, setNotifications] = useState<string[]>([]);
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
          setNotifications((prev) => [
            ...prev,
            payload.new.package_notification_message,
          ]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

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
          "border-2 lg:h-40 h-32 m-4 rounded-lg w-full max-w-xl lg:max-w-3xl",
          "flex flex-col-reverse justify-start items-center"
        )}
      >
        <div className="flex flex-col justify-end h-auto" ref={containerRef}>
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={cn(
                "text-black text-center text-[12px] sm:text-sm rounded-lg w-full",
                "flex flex-col space-y-2"
              )}
            >
              📢 {notification} 📢
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DashboardNotification;
