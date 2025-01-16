"use client";

import {
  convertUnreadToRead,
  getUnserNotificationWithLimit,
} from "@/app/actions/user/userAction";
import { useToast } from "@/hooks/use-toast";
import { useUserNotificationStore } from "@/store/userNotificationStore";
import { alliance_member_table } from "@prisma/client";
import { BellIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { DialogContent, DialogFooter, DialogTitle } from "../ui/dialog";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

type DataTableProps = {
  teamMemberProfile: alliance_member_table | null;
};

const NotificationTable = ({ teamMemberProfile }: DataTableProps) => {
  const { toast } = useToast();
  const [activePage, setActivePage] = useState(1);
  const [isFetchingList, setIsFetchingList] = useState(false);

  const [activeTab, setActiveTab] = useState("unread");
  const { userNotification, setUserNotification, setAddUserNotification } =
    useUserNotificationStore();
  const [count, setCount] = useState(0);

  const fetchRequest = async () => {
    if (!teamMemberProfile) return;

    const isUnread = activeTab === "unread";
    const cachedNotifications = isUnread
      ? userNotification.unread
      : userNotification.read;

    if (
      cachedNotifications.slice((activePage - 1) * 10, activePage * 10).length >
        0 &&
      count > 0
    ) {
      console.log("cached");
      return;
    }

    try {
      const { data, count } = await getUnserNotificationWithLimit({
        page: activePage,
        limit: 10,
        teamMemberId: teamMemberProfile.alliance_member_id,
        isRead: activeTab === "unread" ? false : true,
      });
      console.log(count);

      setUserNotification({
        unread: isUnread ? data : [],
        read: !isUnread ? data : userNotification.read,
        count,
      });

      setCount(count);
    } catch (error) {
    } finally {
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [teamMemberProfile, activeTab]);

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
        isRead: activeTab === "unread" ? false : true,
      });

      setAddUserNotification({
        unread: activeTab === "unread" ? data : [],
        read: activeTab === "all" ? data : [],
        count,
      });
    } catch (error) {
    } finally {
      setIsFetchingList(false);
    }
  };

  const handleConvertUnreadToRead = async (notificationId: string) => {
    try {
      const notification = await convertUnreadToRead({
        notificationId,
        teamMemberId: teamMemberProfile?.alliance_member_id || "",
      });

      setUserNotification({
        unread: userNotification.unread.filter(
          (notif) => notif.alliance_notification_id !== notificationId
        ),
        read: [...userNotification.read, notification],
        count: userNotification.count - 1,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
      });
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
            <Tabs
              defaultValue="unread"
              className=""
              onValueChange={(value) => {
                setActiveTab(value);
                setActivePage(1);
              }}
            >
              <TabsList className="flex justify-start space-x-4 w-min">
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
              <TabsContent value="unread" className="w-full">
                {userNotification.unread.length > 0 ? (
                  <ul className="space-y-2">
                    {userNotification.unread.map((notification) => (
                      <li
                        onClick={() =>
                          handleConvertUnreadToRead(
                            notification.alliance_notification_id
                          )
                        }
                        key={notification.alliance_notification_id}
                        className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm flex items-center justify-between px-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
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
                        <BellIcon className="w-4 h-4" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No unread notifications available.
                  </p>
                )}
                {userNotification.unread.length > 0 &&
                  userNotification.unread.length < count && (
                    <Button
                      className="mt-2 w-full"
                      variant="card"
                      onClick={loadMoreNotifications}
                      disabled={isFetchingList}
                    >
                      {isFetchingList ? "Loading..." : "Load More"}
                    </Button>
                  )}
              </TabsContent>

              <TabsContent value="all">
                {userNotification.read.length > 0 ? (
                  <ul className="space-y-2">
                    {userNotification.read.map((notification) => (
                      <li
                        key={notification.alliance_notification_id}
                        className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm"
                      >
                        <p className="text-sm font-medium">
                          {notification.alliance_notification_message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(
                            notification.alliance_notification_date_created
                          ).toLocaleString()}
                        </p>
                        <BellIcon className="w-4 h-4" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No notifications available.
                  </p>
                )}

                {userNotification.read.length > 0 &&
                  userNotification.read.length < count && (
                    <Button
                      className="mt-2 w-full"
                      variant="card"
                      onClick={loadMoreNotifications}
                      disabled={isFetchingList}
                    >
                      {isFetchingList ? "Loading..." : "Load More"}
                    </Button>
                  )}
              </TabsContent>
            </Tabs>
            <DialogFooter className="flex justify-center"></DialogFooter>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DialogContent>
      </Card>
    </ScrollArea>
  );
};

export default NotificationTable;
