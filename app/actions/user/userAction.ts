"use server";

import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
import { alliance_notification_table } from "@prisma/client";
import { z } from "zod";

export const updateUserNotification = async (teamMemberId: string) => {
  await prisma.alliance_notification_table.updateMany({
    where: {
      alliance_notification_user_id: teamMemberId,
      alliance_notification_is_read: false,
    },
    data: {
      alliance_notification_is_read: true,
    },
  });
};

const convertUnreadToReadSchema = z.object({
  notificationId: z.string().uuid(),
  teamMemberId: z.string().uuid(),
});

export const convertUnreadToRead = async (params: {
  notificationId: string;
  teamMemberId: string;
}) => {
  try {
    const validate = convertUnreadToReadSchema.safeParse(params);

    if (!validate.success) {
      throw new Error(validate.error.message);
    }

    const { notificationId, teamMemberId } = params;

    const isAllowed = await rateLimit(`rate-limit:${teamMemberId}`, 50, 60);

    if (!isAllowed) {
      throw new Error("Too many requests. Please try again later.");
    }

    const userNotification = await prisma.alliance_notification_table.update({
      where: {
        alliance_notification_id: notificationId,
      },
      data: {
        alliance_notification_is_read: true,
      },
    });

    return userNotification as alliance_notification_table;
  } catch (error) {
    throw new Error("Failed to fetch user notifications");
  }
};
