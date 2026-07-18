import type {
  Server,
} from "socket.io";

import type { EventOutbox } from "../schema_types/outbox-event.type.js";

import {
  getPayload,
} from "./event-handler.utils.js";

////////////////////////////////////////////////////////////
// PAYLOAD
////////////////////////////////////////////////////////////

type ConversationEventPayload = {
  conversationId: string;
  data?: unknown;
};

type MessageEventPayload = {
  message: {
    id: string;
    conversationId: string;
  };

  data?: unknown;
};

////////////////////////////////////////////////////////////
// HANDLER
////////////////////////////////////////////////////////////

export class WebsocketEventHandler {
  constructor(
    private readonly io: Server,
  ) {}

  supports(
    eventType: string,
  ): boolean {
    return [
      "MESSAGE_CREATED",
      "MESSAGE_EDITED",
      "MESSAGE_DELETED",
      "MESSAGE_READ",

      "CONVERSATION_CREATED",
      "CONVERSATION_ASSIGNED",
      "CONVERSATION_UNASSIGNED",
      "CONVERSATION_STATUS_CHANGED",
      "CONVERSATION_PRIORITY_CHANGED",

      "CONVERSATION_RESOLVED",
      "CONVERSATION_CLOSED",
      "CONVERSATION_REOPENED",
    ].includes(eventType);
  }

  async handle(
    event: EventOutbox,
  ): Promise<void> {
    switch (event.type) {
      //////////////////////////////////////////////////////
      // MESSAGE EVENTS
      //////////////////////////////////////////////////////

      case "MESSAGE_CREATED": {
        const payload =
          getPayload<MessageEventPayload>(
            event,
          );

        this.io
          .to(
            `conversation:${payload.message.conversationId}`,
          )
          .emit(
            "message:created",
            payload,
          );

        return;
      }

      case "MESSAGE_EDITED": {
        const payload =
          getPayload<MessageEventPayload>(
            event,
          );

        this.io
          .to(
            `conversation:${payload.message.conversationId}`,
          )
          .emit(
            "message:edited",
            payload,
          );

        return;
      }

      case "MESSAGE_DELETED": {
        const payload =
          getPayload<MessageEventPayload>(
            event,
          );

        this.io
          .to(
            `conversation:${payload.message.conversationId}`,
          )
          .emit(
            "message:deleted",
            payload,
          );

        return;
      }

      //////////////////////////////////////////////////////
      // CONVERSATION EVENTS
      //////////////////////////////////////////////////////

      case "CONVERSATION_CREATED":
      case "CONVERSATION_ASSIGNED":
      case "CONVERSATION_UNASSIGNED":
      case "CONVERSATION_STATUS_CHANGED":
      case "CONVERSATION_PRIORITY_CHANGED":
      case "CONVERSATION_RESOLVED":
      case "CONVERSATION_CLOSED":
      case "CONVERSATION_REOPENED": {
        const payload =
          getPayload<ConversationEventPayload>(
            event,
          );

        this.io
          .to(
            `conversation:${payload.conversationId}`,
          )
          .emit(
            `conversation:${event.type.toLowerCase()}`,
            payload,
          );

        return;
      }

      default:
        throw new Error(
          `Unsupported websocket event: ${event.type}`,
        );
    }
  }
}