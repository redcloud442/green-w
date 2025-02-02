import { useUserNotificationStore } from "@/store/userNotificationStore";
import { useRef, useState } from "react";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { DialogContent, DialogFooter, DialogTitle } from "../ui/dialog";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

type DataTableProps = {
  teamMemberId: string | null;
};

const NotificationTable = ({ teamMemberId }: DataTableProps) => {
  const [activePage, setActivePage] = useState(1);
  const [isFetchingList, setIsFetchingList] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const { userNotification } = useUserNotificationStore();

  return (
    <ScrollArea className="w-full overflow-x-auto">
      <Card className="w-full shadow-2xl rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Notification
          </CardTitle>
          <Separator className="my-2 bg-zinc-800" />
        </CardHeader>

        <DialogContent
          type="table"
          className="w-[400px] sm:w-[600px] dark:bg-cardColor border-none shadow-none overflow-auto"
        >
          <ScrollArea className="h-[600px]">
            <DialogTitle className="text-2xl font-bold mb-4">
              Notifications
            </DialogTitle>

            {userNotification.notifications.length > 0 ? (
              <ul className="space-y-2">
                {userNotification.notifications.map((notification) => (
                  <li
                    key={notification.alliance_notification_id}
                    className={`p-2 ${
                      notification.alliance_notification_is_read
                        ? "bg-zinc-400/50"
                        : ""
                    } bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm flex items-center justify-between px-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700`}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {notification.alliance_notification_message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(
                          notification.alliance_notification_date_created
                        ).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                No unread notifications available.
              </p>
            )}

            {/* Observer for Infinite Scroll */}
            <div ref={observerRef} className="h-1" />

            {isFetchingList && (
              <p className="text-sm text-gray-500 text-center mt-2">
                Loading more notifications...
              </p>
            )}

            <DialogFooter className="flex justify-center"></DialogFooter>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DialogContent>
      </Card>
    </ScrollArea>
  );
};

export default NotificationTable;
