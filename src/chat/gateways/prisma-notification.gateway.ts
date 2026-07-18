import { prisma } from "../../lib/prismadb.js";

import type { Prisma } from "@prisma/client";

import { requireAuthenticated, type ChatActor } from "../interfaces/actor.interface.js";

import type { INotificationGateway } from "../gateway-interface/notification.gateway.interface.js";

import {
  type CreateNotification,
  type Notification,
  type UpdateNotification,
} from "../schema_types/notification.type.js";
import { NotificationSchema } from "../schemas/notification.schema.js";

export class PrismaNotificationGateway
  implements INotificationGateway
{
  ////////////////////////////////////////////////////////////
  // MAPPER
  ////////////////////////////////////////////////////////////

  private map(
    notification: Prisma.NotificationGetPayload<Record<string, never>>,
  ): Notification {
    return NotificationSchema.parse({
      id: notification.id,

      userId: notification.userId,

      type: notification.type,

      title: notification.title,

      message: notification.message,

      isRead: notification.isRead,

      entityType: notification.entityType,

      entityId: notification.entityId,

      conversationId:
        notification.conversationId,

      messageId: notification.messageId,

      senderId: notification.senderId,

      readAt: notification.readAt,

      createdAt: notification.createdAt,
    });
  }

  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  async create(
    actor: ChatActor,
    data: CreateNotification,
  ): Promise<Notification> {
    const notification =
      await prisma.notification.create({
        data: {
          userId: data.userId,

          type: data.type,

          title: data.title,

          message: data.message,

          entityType:
            data.entityType ?? null,

          entityId:
            data.entityId ?? null,

          conversationId:
            data.conversationId ??
            null,

          messageId:
            data.messageId ?? null,

          senderId:
            data.senderId ?? null,
        },
      });

    return this.map(notification);
  }

  async createMany(
    actor: ChatActor,
    data: CreateNotification[],
  ): Promise<Notification[]> {
    if (data.length === 0) {
      return [];
    }

    const notifications =
      await prisma.$transaction(
        data.map((notification) =>
          prisma.notification.create({
            data: {
              userId:
                notification.userId,

              type:
                notification.type,

              title:
                notification.title,

              message:
                notification.message,

              entityType:
                notification.entityType ??
                null,

              entityId:
                notification.entityId ??
                null,

              conversationId:
                notification.conversationId ??
                null,

              messageId:
                notification.messageId ??
                null,

              senderId:
                notification.senderId ??
                null,
            },
          }),
        ),
      );

    return notifications.map((notification) =>
      this.map(notification),
    );
  }

    ////////////////////////////////////////////////////////////
  // UPDATE
  ////////////////////////////////////////////////////////////

  async update(
    actor: ChatActor,
    id: string,
    data: UpdateNotification,
  ): Promise<Notification> {
    const notification =
      await prisma.notification.update({
        where: {
          id,
        },
        data: {
          ...(data.title !== undefined && {
            title: data.title,
          }),

          ...(data.message !== undefined && {
            message: data.message,
          }),

          ...(data.entityType !== undefined && {
            entityType: data.entityType,
          }),

          ...(data.entityId !== undefined && {
            entityId: data.entityId,
          }),

          ...(data.conversationId !==
            undefined && {
            conversationId:
              data.conversationId,
          }),

          ...(data.messageId !==
            undefined && {
            messageId: data.messageId,
          }),

          ...(data.senderId !==
            undefined && {
            senderId: data.senderId,
          }),

          ...(data.isRead !== undefined && {
            isRead: data.isRead,
          }),

          ...(data.readAt !== undefined && {
            readAt: data.readAt,
          }),
        },
      });

    return this.map(notification);
  }

  async markAsRead(
    actor: ChatActor,
    id: string,
  ): Promise<Notification> {
    const notification =
      await prisma.notification.update({
        where: {
          id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

    return this.map(notification);
  }

async markAllAsRead(
  actor: ChatActor,
): Promise<void> {
  requireAuthenticated(actor);

  await prisma.notification.updateMany({
    where: {
      userId: actor.userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}
  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<Notification | null> {
    const notification =
      await prisma.notification.findUnique({
        where: {
          id,
        },
      });

    if (!notification) {
      return null;
    }

    return this.map(notification);
  }

    async findMany(
    actor: ChatActor,
    page = 1,
    limit = 20,
    ): Promise<Notification[]> {
    requireAuthenticated(actor);

    const notifications =
        await prisma.notification.findMany({
        where: {
            userId: actor.userId,
        },
        orderBy: {
            createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
        });

    return notifications.map((notification) =>
        this.map(notification),
    );
    }

    async count(
    actor: ChatActor,
    ): Promise<number> {
    requireAuthenticated(actor);

    return prisma.notification.count({
        where: {
        userId: actor.userId,
        },
    });
    }

    async countUnread(
    actor: ChatActor,
    ): Promise<number> {
    requireAuthenticated(actor);

    return prisma.notification.count({
        where: {
        userId: actor.userId,
        isRead: false,
        },
    });
    }
    ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    actor: ChatActor,
    id: string,
  ): Promise<void> {
    await prisma.notification.delete({
      where: {
        id,
      },
    });
  }

    async deleteAll(
    actor: ChatActor,
    ): Promise<void> {
    requireAuthenticated(actor);

    await prisma.notification.deleteMany({
        where: {
        userId: actor.userId,
        },
    });
    }

}