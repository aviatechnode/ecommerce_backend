import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { INotificationGateway } from "../gateway-interface/notification.gateway.interface.js";

import type { IConversationService } from "../interfaces/conversation.interface.js";

import type { IConversationParticipantService } from "../interfaces/conversation-participant.interface.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { INotificationService } from "../interfaces/notification.interface.js";

import { NotificationPolicy } from "../policies/notification.policy.js";

import type {
  CreateNotification,
  Notification,
  UpdateNotification,
} from "../schema_types/notification.type.js";

import type { Message } from "../schema_types/message.type.js";

export class NotificationService
  implements INotificationService
{
  private static readonly DEFAULT_PAGE = 1;

  private static readonly DEFAULT_LIMIT = 20;

  private static readonly MAX_LIMIT = 100;

  constructor(
    private readonly gateway:
      INotificationGateway,

    private readonly conversationService:
      IConversationService,

    private readonly participantService:
      IConversationParticipantService,

    private readonly policy:
      NotificationPolicy,
  ) {}

  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  async create(
    actor: ChatActor,
    data: CreateNotification,
  ): Promise<Notification> {
    this.policy.create(
      actor,
      data,
    );

    return this.gateway.create(
      actor,
      data,
    );
  }

  async createMany(
    actor: ChatActor,
    data: CreateNotification[],
  ): Promise<Notification[]> {
    this.policy.createMany(
      actor,
      data,
    );

    return this.gateway.createMany(
      actor,
      data,
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
      await this.requireNotification(
        actor,
        id,
      );

    this.policy.update(
      actor,
      notification,
    );

    return this.gateway.update(
      actor,
      id,
      data,
    );
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<Notification | null> {
    const notification =
      await this.gateway.findById(
        actor,
        id,
      );

    if (!notification) {
      return null;
    }

    this.policy.view(
      actor,
      notification,
    );

    return notification;
  }

  async list(
    actor: ChatActor,
    page =
      NotificationService.DEFAULT_PAGE,
    limit =
      NotificationService.DEFAULT_LIMIT,
  ): Promise<{
    data: Notification[];
    total: number;
    unread: number;
  }> {
    this.policy.list(
      actor,
    );

    const normalizedPage =
      this.normalizePage(
        page,
      );

    const normalizedLimit =
      this.normalizeLimit(
        limit,
      );

    const [
      data,
      total,
      unread,
    ] = await Promise.all([
      this.gateway.findMany(
        actor,
        normalizedPage,
        normalizedLimit,
      ),

      this.gateway.count(
        actor,
      ),

      this.gateway.countUnread(
        actor,
      ),
    ]);

    return {
      data,
      total,
      unread,
    };
  }

  ////////////////////////////////////////////////////////////
  // READ STATUS
  ////////////////////////////////////////////////////////////

  async markAsRead(
    actor: ChatActor,
    id: string,
  ): Promise<Notification> {
    const notification =
      await this.requireNotification(
        actor,
        id,
      );

    this.policy.markAsRead(
      actor,
      notification,
    );

    return this.gateway.markAsRead(
      actor,
      id,
    );
  }

  async markAllAsRead(
    actor: ChatActor,
  ): Promise<void> {
    this.policy.markAllAsRead(
      actor,
    );

    await this.gateway.markAllAsRead(
      actor,
    );
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS NOTIFICATIONS
  ////////////////////////////////////////////////////////////

  async notifyChatMessage(
    actor: ChatActor,
    message: Message,
  ): Promise<void> {
    const participants =
      await this.participantService
        .findByConversation(
          actor,
          message.conversationId,
        );

    const senderId =
      "userId" in actor
        ? actor.userId
        : undefined;

    const recipients =
      participants.filter(
        participant =>
          participant.userId !==
          senderId,
      );

    if (
      recipients.length === 0
    ) {
      return;
    }

    const content =
      message.content ??
      "You have a new chat message.";

    const notifications =
      recipients.map(
        participant => ({
          userId:
            participant.userId,

          type:
            "CHAT_MESSAGE" as const,

          title:
            "New chat message",

          message:
            content,

          conversationId:
            message.conversationId,

          messageId:
            message.id,

          ...(senderId
            ? {
                senderId,
              }
            : {}),
        }),
      );

    await this.createMany(
      actor,
      notifications,
    );
  }

  async notifyAssigned(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void> {
    const conversation =
      await this.requireConversation(
        actor,
        conversationId,
      );

    if (
      !conversation.assignedUserId
    ) {
      return;
    }

    if (
      this.isActor(
        actor,
        conversation.assignedUserId,
      )
    ) {
      return;
    }

    await this.create(
      actor,
      {
        userId:
          conversation.assignedUserId,

        type:
          "CHAT_ASSIGNED",

        title:
          "Conversation assigned",

        message:
          "A conversation has been assigned to you.",

        conversationId,
      },
    );
  }

  async notifyUnassigned(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void> {
    const conversation =
      await this.requireConversation(
        actor,
        conversationId,
      );

    if (
      !conversation.assignedUserId
    ) {
      return;
    }

    if (
      this.isActor(
        actor,
        conversation.assignedUserId,
      )
    ) {
      return;
    }

    await this.create(
      actor,
      {
        userId:
          conversation.assignedUserId,

        type:
          "CHAT_UNASSIGNED",

        title:
          "Conversation unassigned",

        message:
          "You have been unassigned from a conversation.",

        conversationId,
      },
    );
  }

  async notifyStatusChanged(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void> {
    const conversation =
      await this.requireConversation(
        actor,
        conversationId,
      );

    if (
      !conversation.assignedUserId
    ) {
      return;
    }

    if (
      this.isActor(
        actor,
        conversation.assignedUserId,
      )
    ) {
      return;
    }

    await this.create(
      actor,
      {
        userId:
          conversation.assignedUserId,

        type:
          "CHAT_STATUS_CHANGED",

        title:
          "Conversation status changed",

        message:
          `Conversation status changed to ${conversation.status}.`,

        conversationId,
      },
    );
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    actor: ChatActor,
    id: string,
  ): Promise<void> {
    const notification =
      await this.requireNotification(
        actor,
        id,
      );

    this.policy.delete(
      actor,
      notification,
    );

    await this.gateway.delete(
      actor,
      id,
    );
  }

  async deleteAll(
    actor: ChatActor,
  ): Promise<void> {
    this.policy.deleteAll(
      actor,
    );

    await this.gateway.deleteAll(
      actor,
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private async requireNotification(
    actor: ChatActor,
    id: string,
  ): Promise<Notification> {
    const notification =
      await this.gateway.findById(
        actor,
        id,
      );

    if (!notification) {
      throw new BusinessRuleError(
        "Notification not found.",
      );
    }

    return notification;
  }

  private async requireConversation(
    actor: ChatActor,
    conversationId: string,
  ) {
    const conversation =
      await this.conversationService.findById(
        actor,
        conversationId,
      );

    if (!conversation) {
      throw new BusinessRuleError(
        "Conversation not found.",
      );
    }

    return conversation;
  }

  private isActor(
    actor: ChatActor,
    userId: string,
  ): boolean {
    return (
      "userId" in actor &&
      actor.userId === userId
    );
  }

  private normalizePage(
    page: number,
  ): number {
    if (
      !Number.isInteger(page) ||
      page < 1
    ) {
      return NotificationService.DEFAULT_PAGE;
    }

    return page;
  }

  private normalizeLimit(
    limit: number,
  ): number {
    if (
      !Number.isInteger(limit) ||
      limit < 1
    ) {
      return NotificationService.DEFAULT_LIMIT;
    }

    return Math.min(
      limit,
      NotificationService.MAX_LIMIT,
    );
  }
}