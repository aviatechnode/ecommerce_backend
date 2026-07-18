import type { EventOutbox } from "../schema_types/outbox-event.type.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { ConversationEventService } from "../services/conversation-event.service.js";

import { getPayload } from "./event-handler.utils.js";

////////////////////////////////////////////////////////////
// PAYLOAD
////////////////////////////////////////////////////////////

type ConversationEventPayload = {
  conversationId: string;
  actorId?: string | null;
  description?: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
};

////////////////////////////////////////////////////////////
// HANDLER
////////////////////////////////////////////////////////////

export class ConversationEventHandler {
  constructor(
    private readonly eventService: ConversationEventService,
  ) {}

  supports(
    eventType: string,
  ): boolean {
    return [
      "CONVERSATION_CREATED",
      "CONVERSATION_ASSIGNED",
      "CONVERSATION_UNASSIGNED",
      "CONVERSATION_STATUS_CHANGED",
      "CONVERSATION_PRIORITY_CHANGED",
      "CONVERSATION_LOCKED",
      "CONVERSATION_UNLOCKED",
      "CONVERSATION_RESOLVED",
      "CONVERSATION_CLOSED",
      "CONVERSATION_REOPENED",
      "CONVERSATION_RATED",
      "MESSAGE_SENT",
      "MESSAGE_EDITED",
      "MESSAGE_DELETED",
      "MESSAGE_READ",
      "ATTACHMENT_ADDED",
      "INTERNAL_NOTE_CREATED",
      "TAG_ADDED",
      "TAG_REMOVED",
    ].includes(eventType);
  }

  async handle(
    event: EventOutbox,
  ): Promise<void> {
    const payload =
      getPayload<ConversationEventPayload>(
        event,
      );

    const actor: ChatActor = {
      permissions: new Set(),
      isAuthenticated: false,
      isGuest: false,
      isSystem: true,
      isSuperAdmin: true,
    };

    await this.eventService.record(
      actor,
      {
        conversationId:
          payload.conversationId,

        type:
          event.type as any,

        description:
          payload.description ??
          `Event: ${event.type}`,

        oldValue:
          payload.oldValue,

        newValue:
          payload.newValue,

        metadata:
          payload.metadata,
      },
    );
  }
}