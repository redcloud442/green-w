import { alliance_notification_table } from "@prisma/client";
import { create } from "zustand";

interface userNotificationState {
  userNotification: {
    notifications: alliance_notification_table[];
    count: number;
  };

  setUserNotification: (notification: {
    notifications: alliance_notification_table[];
    count: number;
  }) => void;

  setAddUserNotification: (notification: {
    notifications: alliance_notification_table[];
    count?: number; // Optional to allow adding without resetting count
  }) => void;
}

export const useUserNotificationStore = create<userNotificationState>(
  (set) => ({
    userNotification: {
      notifications: [],
      count: 0,
    },

    setUserNotification: (notification) =>
      set((state) => ({
        userNotification: {
          notifications: notification.notifications,
          count: notification.count || state.userNotification.count,
        },
      })),

    setAddUserNotification: (notification) =>
      set((state) => ({
        userNotification: {
          notifications: [
            ...state.userNotification.notifications,
            ...notification.notifications,
          ],
          count: notification.count || state.userNotification.count,
        },
      })),
  })
);
