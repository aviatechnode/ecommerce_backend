import type { EventOutbox } from "../schema_types/outbox-event.type.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { ConversationSLAService } from "../services/conversation-sla.service.js";

import {
  getPayload,
} from "./event-handler.utils.js";

////////////////////////////////////////////////////////////
// PAYLOADS
////////////////////////////////////////////////////////////

type ConversationPayload = {
  conversationId: string;
};

type MessageSentPayload = {
  message: {
    conversationId: string;
    senderType: string;
  };
};

////////////////////////////////////////////////////////////
// HANDLER
////////////////////////////////////////////////////////////

export class SlaEventHandler {
  constructor(
    private readonly slaService:
      ConversationSLAService,
  ) {}

  supports(
    eventType: string,
  ): boolean {
    return [
      "CONVERSATION_CREATED",
      "MESSAGE_SENT",
      "CONVERSATION_RESOLVED",
      "CONVERSATION_CLOSED",
    ].includes(eventType);
  }

  async handle(
    event: EventOutbox,
  ): Promise<void> {
    const actor =
      this.systemActor();

    switch (event.type) {
      case "CONVERSATION_CREATED": {
        const payload =
          getPayload<ConversationPayload>(
            event,
          );

        await this.slaService.create(
          actor,
          payload.conversationId,
        );

        return;
      }

      case "MESSAGE_SENT": {
        const payload =
          getPayload<MessageSentPayload>(
            event,
          );
          
        if (
          payload.message.senderType ===
          "AGENT"
        ) {
          await this.slaService
            .markFirstResponded(
              actor,
              payload.message.conversationId,
            );
        }

        return;
      }

      case "CONVERSATION_RESOLVED": {
        const payload =
          getPayload<ConversationPayload>(
            event,
          );

        await this.slaService
          .markResolved(
            actor,
            payload.conversationId,
          );

        return;
      }

      case "CONVERSATION_CLOSED": {
        // No SLA action currently required.
        return;
      }

      default:
        throw new Error(
          `Unsupported SLA event: ${event.type}`,
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