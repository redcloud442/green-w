import { handleFetchMemberNotification } from "@/services/notification/member";
import { useUserNotificationStore } from "@/store/userNotificationStore";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { DialogContent, DialogFooter, DialogTitle } from "../ui/dialog";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

type DataTableProps = {
  teamMemberId: string | null;
};

const NotificationTable = ({ teamMemberId }: DataTableProps) => {
  const [take, setTake] = useState(10); // Start with 10 notifications
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);
  const { userNotification, setAddUserNotification } =
    useUserNotificationStore();

  const loadMoreNotifications = async () => {
    if (isFetchingList || noMoreData) return;

    setIsFetchingList(true);

    const data = await handleFetchMemberNotification({
      take: 10, // Always fetch the next 10 items
      skip: userNotification.notifications.length, // Skip already fetched items
      teamMemberId: teamMemberId ?? "",
    });

    if (data.notifications.length === 0) {
      setNoMoreData(true); // No more notifications to fetch
    } else {
      setAddUserNotification({
        notifications: data.notifications,
        count: data.count,
      });
      setTake((prev) => prev + 10); // Increment `take` by 10
    }

    setIsFetchingList(false);
  };

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

            {userNotification?.notifications.length > 0 ? (
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

            {userNotification?.notifications.length > 0 && !noMoreData && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="card"
                  onClick={loadMoreNotifications}
                  disabled={isFetchingList}
                >
                  {isFetchingList ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}

            {noMoreData && (
              <p className="text-sm text-gray-500 text-center mt-2">
                No more notifications available.
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
