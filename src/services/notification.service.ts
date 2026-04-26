import { prisma } from "../lib/prismadb.js";
import { NotificationType } from "@prisma/client";

/* =========================================================
   TYPES
========================================================= */
export type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
};

/* =========================================================
   CREATE NOTIFICATION
========================================================= */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  entityType,
  entityId,
}: CreateNotificationParams) => {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
    },
  });
};

export const notifyAdmins = async (
  data: Omit<CreateNotificationParams, "userId">
) => {
  const admins = await prisma.user.findMany({
    where: {
      role: {
        name: "ADMIN",
      },
    },
    select: { id: true },
  });

  if (!admins.length) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: data.type,
      title: data.title,
      message: data.message,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
    })),
  });
};
