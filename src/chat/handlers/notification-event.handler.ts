import type { EventOutbox } from "../schema_types/outbox-event.type.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { NotificationService } from "../services/notification.service.js";

import {
  getPayload,
} from "./event-handler.utils.js";

////////////////////////////////////////////////////////////
// PAYLOADS
////////////////////////////////////////////////////////////

type MessageCreatedPayload = {
  message: {
    id: string;
    conversationId: string;
    senderId?: string | null;
    content?: string | null;
  };
};

type ConversationAssignedPayload = {
  conversationId: string;
};

type ConversationStatusChangedPayload = {
  conversationId: string;
};

////////////////////////////////////////////////////////////
// HANDLER
////////////////////////////////////////////////////////////

export class NotificationEventHandler {
  constructor(
    private readonly notificationService:
      NotificationService,
  ) {}

  supports(
    eventType: string,
  ): boolean {
    return [
      "MESSAGE_CREATED",
      "CONVERSATION_ASSIGNED",
      "CONVERSATION_UNASSIGNED",
      "CONVERSATION_STATUS_CHANGED",
    ].includes(eventType);
  }

  async handle(
    event: EventOutbox,
  ): Promise<void> {
    const actor =
      this.systemActor();

    switch (event.type) {
      case "MESSAGE_CREATED": {
        const payload =
          getPayload<MessageCreatedPayload>(
            event,
          );

        await this.notificationService
          .notifyChatMessage(
            actor,
            payload.message as any,
          );

        return;
      }

      case "CONVERSATION_ASSIGNED": {
        const payload =
          getPayload<ConversationAssignedPayload>(
            event,
          );

        await this.notificationService
          .notifyAssigned(
            actor,
            payload.conversationId,
          );

        return;
      }

      case "CONVERSATION_UNASSIGNED": {
        const payload =
          getPayload<ConversationAssignedPayload>(
            event,
          );

        await this.notificationService
          .notifyUnassigned(
            actor,
            payload.conversationId,
          );

        return;
      }

      case "CONVERSATION_STATUS_CHANGED": {
        const payload =
          getPayload<ConversationStatusChangedPayload>(
            event,
          );

        await this.notificationService
          .notifyStatusChanged(
            actor,
            payload.conversationId,
          );

        return;
      }

      default:
        throw new Error(
          `Unsupported notification event: ${event.type}`,
        );
    }
  }

  private systemActor(): ChatActor {
    return {
      permissions: new Set(),
      isAuthenticated: false,
      isGuest: false,
      isSystem: true,
      isSuperAdmin: true,
    };
  }
}