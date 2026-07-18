import type { ChatActor } from "../interfaces/actor.interface.js";
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

import { BasePolicy } from "./base.policy.js";

export class ConversationEventPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    _data: CreateConversationEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationEvent:create");
  }

  view(
    actor: ChatActor,
    _event: ConversationEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationEvent:view");
  }

  list(
    actor: ChatActor,
    _filters: ListConversationEvents,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationEvent:view");
  }

  delete(
    actor: ChatActor,
    _event: ConversationEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationEvent:delete");
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS EVENTS
  ////////////////////////////////////////////////////////////

  record(
    actor: ChatActor,
    data: CreateConversationEvent,
  ): void {
    this.create(actor, data);
  }

  recordAssignment(
    actor: ChatActor,
    _data: RecordAssignmentEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(
      actor,
      "conversationEvent:create",
    );
  }

  recordStatusChange(
    actor: ChatActor,
    _data: RecordStatusChangeEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(
      actor,
      "conversationEvent:create",
    );
  }

  recordPriorityChange(
    actor: ChatActor,
    _data: RecordPriorityChangeEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(
      actor,
      "conversationEvent:create",
    );
  }

  recordTagAdded(
    actor: ChatActor,
    _data: RecordTagAddedEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(
      actor,
      "conversationEvent:create",
    );
  }

  recordTagRemoved(
    actor: ChatActor,
    _data: RecordTagRemovedEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(
      actor,
      "conversationEvent:create",
    );
  }

  recordMessageSent(
    actor: ChatActor,
    _data: RecordMessageSentEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(
      actor,
      "conversationEvent:create",
    );
  }

  recordConversationClosed(
    actor: ChatActor,
    _data: RecordConversationClosedEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(
      actor,
      "conversationEvent:create",
    );
  }

  recordConversationResolved(
    actor: ChatActor,
    _data: RecordConversationResolvedEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(
      actor,
      "conversationEvent:create",
    );
  }
}