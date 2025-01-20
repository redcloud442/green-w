"use client";

import {
  getUnserNotificationWithLimit,
  updateUserNotification,
} from "@/app/actions/user/userAction";
import { useUserNotificationStore } from "@/store/userNotificationStore";
import { alliance_member_table } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { DialogContent, DialogFooter, DialogTitle } from "../ui/dialog";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

type DataTableProps = {
  teamMemberProfile: alliance_member_table | null;
};

const NotificationTable = ({ teamMemberProfile }: DataTableProps) => {
  const [activePage, setActivePage] = useState(1);
  const [isFetchingList, setIsFetchingList] = useState(false);
  const fetchCalled = useRef(false);
  const { userNotification, setUserNotification, setAddUserNotification } =
    useUserNotificationStore();

  const fetchRequest = async () => {
    if (!teamMemberProfile) return;

    try {
      const { data } = await getUnserNotificationWithLimit({
        page: activePage,
        limit: 10,
        teamMemberId: teamMemberProfile.alliance_member_id,
        isRead: false,
      });

      if (
        userNotification.notifications.some(
          (n) => n.alliance_notification_is_read === false
        )
      ) {
        await updateUserNotification(teamMemberProfile.alliance_member_id);
      }

      setUserNotification({
        notifications: data,
        count: 0,
      });
    } catch (error) {
    } finally {
    }
  };

  useEffect(() => {
    if (fetchCalled.current) return;
    fetchCalled.current = true;
    fetchRequest();
  }, [teamMemberProfile]);

  const loadMoreNotifications = async () => {
    if (!teamMemberProfile) return;
    setActivePage(activePage + 1);

    const nextPage = activePage + 1;

    try {
      setIsFetchingList(true);
      const { data, count } = await getUnserNotificationWithLimit({
        page: nextPage,
        limit: 10,
        teamMemberId: teamMemberProfile?.alliance_member_id,
        isRead: false,
      });

      setAddUserNotification({
        notifications: data,
        count,
      });
    } catch (error) {
    } finally {
      setIsFetchingList(false);
    }
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

            {userNotification.notifications.length > 0 ? (
              <ul className="space-y-2">
                {userNotification.notifications.map((notification) => (
                  <li
                    key={notification.alliance_notification_id}
                    className={`p-2 ${notification.alliance_notification_is_read ? "bg-zinc-400/50" : ""} bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm flex items-center justify-between px-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700`}
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
            {userNotification.notifications.length > 0 &&
              userNotification.notifications.length <
                userNotification.count && (
                <Button
                  className="mt-2 w-full"
                  variant="card"
                  onClick={loadMoreNotifications}
                  disabled={isFetchingList}
                >
                  {isFetchingList ? "Loading..." : "Load More"}
                </Button>
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
