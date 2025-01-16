import { alliance_notification_table } from "@prisma/client";
import { create } from "zustand";

interface userNotificationState {
  userNotification: {
    unread: alliance_notification_table[];
    read: alliance_notification_table[];
    count: number;
  };

  setUserNotification: (notification: {
    unread: alliance_notification_table[];
    read: alliance_notification_table[];
    count: number;
  }) => void;

  setAddUserNotification: (notification: {
    unread: alliance_notification_table[];
    read: alliance_notification_table[];
    count?: number; // Optional to allow adding without resetting count
  }) => void;
}

export const useUserNotificationStore = create<userNotificationState>(
  (set) => ({
    userNotification: {
      unread: [],
      read: [],
      count: 0,
    },

    setUserNotification: (notification) =>
      set((state) => ({
        userNotification: {
          unread: notification.unread,
          read: notification.read,
          count: state.userNotification.count || notification.count,
        },
      })),

    setAddUserNotification: (notification) =>
      set((state) => ({
        userNotification: {
          unread: [
            ...state.userNotification.unread,
            ...notification.unread.filter(
              (newNotif) =>
                !state.userNotification.unread.some(
                  (existingNotif) =>
                    existingNotif.alliance_notification_id ===
                    newNotif.alliance_notification_id
                )
            ),
          ],
          read: [
            ...state.userNotification.read,
            ...notification.read.filter(
              (newNotif) =>
                !state.userNotification.read.some(
                  (existingNotif) =>
                    existingNotif.alliance_notification_id ===
                    newNotif.alliance_notification_id
                )
            ),
          ],
          count: notification.count || state.userNotification.count,
        },
      })),
  })
);
