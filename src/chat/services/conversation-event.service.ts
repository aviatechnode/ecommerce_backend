import type { ChatActor } from "../interfaces/actor.interface.js";

import type { IConversationEventService } from "../interfaces/conversation-event.interface.js";

import type { IConversationEventGateway } from "../gateway-interface/conversation-event.gateway.interface.js";

import {
  ConversationEventPolicy,
} from "../policies/conversation-event.policy.js";

import type {
  ConversationEvent,
  CreateConversationEvent,
  ListConversationEvents,
  RecordAssignmentEvent,
  RecordConversationClosedEvent,
  RecordConversationResolvedEvent,
  RecordMessageSentEvent,
  RecordPriorityChangeEvent,
  RecordStatusChangeEvent,
  RecordTagAddedEvent,
  RecordTagRemovedEvent,
} from "../schema_types/conversation-event.type.js";

export class ConversationEventService
  implements IConversationEventService
{
  constructor(
    private readonly gateway: IConversationEventGateway,
    private readonly policy =
      new ConversationEventPolicy(),
  ) {}

  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  async create(
    actor: ChatActor,
    data: CreateConversationEvent,
  ): Promise<ConversationEvent> {
    this.policy.create(actor, data);

    return this.gateway.create(
      actor,
      data,
    );
  }

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<ConversationEvent | null> {
    const event =
      await this.gateway.findById(
        actor,
        id,
      );

    if (event) {
      this.policy.view(actor, event);
    }

    return event;
  }

  async list(
    actor: ChatActor,
    filters: ListConversationEvents,
  ): Promise<ConversationEvent[]> {
    this.policy.list(
      actor,
      filters,
    );

    return this.gateway.list(
      actor,
      filters,
    );
  }

  ////////////////////////////////////////////////////////////
  // GENERIC RECORD
  ////////////////////////////////////////////////////////////

  async record(
    actor: ChatActor,
    data: CreateConversationEvent,
  ): Promise<ConversationEvent> {
    this.policy.record(actor, data);

    return this.create(
      actor,
      data,
    );
  }

  ////////////////////////////////////////////////////////////
  // ASSIGNMENT
  ////////////////////////////////////////////////////////////

  async recordAssignment(
    actor: ChatActor,
    data: RecordAssignmentEvent,
  ): Promise<ConversationEvent> {
    this.policy.recordAssignment(
      actor,
      data,
    );

    return this.create(actor, {
      conversationId:
        data.conversationId,

      type:
        "CONVERSATION_ASSIGNED",

      description:
        "Conversation assigned.",

      oldValue: {
        assigneeId:
          data.oldAssigneeId,
      },

      newValue: {
        assigneeId:
          data.newAssigneeId,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // STATUS
  ////////////////////////////////////////////////////////////

  async recordStatusChange(
    actor: ChatActor,
    data: RecordStatusChangeEvent,
  ): Promise<ConversationEvent> {
    this.policy.recordStatusChange(
      actor,
      data,
    );

    return this.create(actor, {
      conversationId:
        data.conversationId,

      type:
        "CONVERSATION_STATUS_CHANGED",

      description:
        "Conversation status changed.",

      oldValue: {
        status:
          data.oldStatus,
      },

      newValue: {
        status:
          data.newStatus,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // PRIORITY
  ////////////////////////////////////////////////////////////

  async recordPriorityChange(
    actor: ChatActor,
    data: RecordPriorityChangeEvent,
  ): Promise<ConversationEvent> {
    this.policy.recordPriorityChange(
      actor,
      data,
    );

    return this.create(actor, {
      conversationId:
        data.conversationId,

      type:
        "CONVERSATION_PRIORITY_CHANGED",

      description:
        "Conversation priority changed.",

      oldValue: {
        priority:
          data.oldPriority,
      },

      newValue: {
        priority:
          data.newPriority,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // TAG ADDED
  ////////////////////////////////////////////////////////////

  async recordTagAdded(
    actor: ChatActor,
    data: RecordTagAddedEvent,
  ): Promise<ConversationEvent> {
    this.policy.recordTagAdded(
      actor,
      data,
    );

    return this.create(actor, {
      conversationId:
        data.conversationId,

      type: "TAG_ADDED",

      description:
        "Tag added.",

      metadata: {
        tagId: data.tagId,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // TAG REMOVED
  ////////////////////////////////////////////////////////////

  async recordTagRemoved(
    actor: ChatActor,
    data: RecordTagRemovedEvent,
  ): Promise<ConversationEvent> {
    this.policy.recordTagRemoved(
      actor,
      data,
    );

    return this.create(actor, {
      conversationId:
        data.conversationId,

      type: "TAG_REMOVED",

      description:
        "Tag removed.",

      metadata: {
        tagId: data.tagId,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // MESSAGE SENT
  ////////////////////////////////////////////////////////////

  async recordMessageSent(
    actor: ChatActor,
    data: RecordMessageSentEvent,
  ): Promise<ConversationEvent> {
    this.policy.recordMessageSent(
      actor,
      data,
    );

    return this.create(actor, {
      conversationId:
        data.conversationId,

      type: "MESSAGE_SENT",

      description:
        "Message sent.",

      metadata: {
        messageId:
          data.messageId,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // CLOSED
  ////////////////////////////////////////////////////////////

  async recordConversationClosed(
    actor: ChatActor,
    data: RecordConversationClosedEvent,
  ): Promise<ConversationEvent> {
    this.policy.recordConversationClosed(
      actor,
      data,
    );

    return this.create(actor, {
      conversationId:
        data.conversationId,

      type:
        "CONVERSATION_CLOSED",

      description:
        data.reason ??
        "Conversation closed.",

      metadata: {
        reason:
          data.reason,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // RESOLVED
  ////////////////////////////////////////////////////////////

  async recordConversationResolved(
    actor: ChatActor,
    data: RecordConversationResolvedEvent,
  ): Promise<ConversationEvent> {
    this.policy.recordConversationResolved(
      actor,
      data,
    );

    return this.create(actor, {
      conversationId:
        data.conversationId,

      type:
        "CONVERSATION_RESOLVED",

      description:
        "Conversation resolved.",

      metadata: {
        resolution:
          data.resolution,
      },
    });
  }
}