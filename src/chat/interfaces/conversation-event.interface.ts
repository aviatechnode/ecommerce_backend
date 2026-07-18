import type { ChatActor } from "./actor.interface.js";

import type {
  ConversationEvent,
  CreateConversationEvent,
  ListConversationEvents,
  RecordAssignmentEvent,
  RecordStatusChangeEvent,
  RecordPriorityChangeEvent,
  RecordTagAddedEvent,
  RecordTagRemovedEvent,
  RecordMessageSentEvent,
  RecordConversationClosedEvent,
  RecordConversationResolvedEvent,
} from "../schemas/events/conversation-event.schema.js";

export interface IConversationEventService {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: CreateConversationEvent,
  ): Promise<ConversationEvent>;

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<ConversationEvent | null>;

  list(
    actor: ChatActor,
    filters: ListConversationEvents,
  ): Promise<ConversationEvent[]>;

  ////////////////////////////////////////////////////////////
  // BUSINESS EVENTS
  ////////////////////////////////////////////////////////////

  record(
    actor: ChatActor,
    data: CreateConversationEvent,
  ): Promise<ConversationEvent>;

  recordAssignment(
    actor: ChatActor,
    data: RecordAssignmentEvent,
  ): Promise<ConversationEvent>;

  recordStatusChange(
    actor: ChatActor,
    data: RecordStatusChangeEvent,
  ): Promise<ConversationEvent>;

  recordPriorityChange(
    actor: ChatActor,
    data: RecordPriorityChangeEvent,
  ): Promise<ConversationEvent>;

  recordTagAdded(
    actor: ChatActor,
    data: RecordTagAddedEvent,
  ): Promise<ConversationEvent>;

  recordTagRemoved(
    actor: ChatActor,
    data: RecordTagRemovedEvent,
  ): Promise<ConversationEvent>;

  recordMessageSent(
    actor: ChatActor,
    data: RecordMessageSentEvent,
  ): Promise<ConversationEvent>;

  recordConversationClosed(
    actor: ChatActor,
    data: RecordConversationClosedEvent,
  ): Promise<ConversationEvent>;

  recordConversationResolved(
    actor: ChatActor,
    data: RecordConversationResolvedEvent,
  ): Promise<ConversationEvent>;
}