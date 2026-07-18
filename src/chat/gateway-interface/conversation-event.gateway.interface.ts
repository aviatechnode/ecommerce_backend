import type { ChatActor } from "../interfaces/actor.interface.js";
import type { 
  ConversationEvent, 
  CreateConversationEvent, 
  ListConversationEvents 
} from "../schema_types/conversation-event.type.js";

export interface IConversationEventGateway {
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

  count(
    actor: ChatActor,
    filters?: Partial<ListConversationEvents>,
  ): Promise<number>;

  delete(
    actor: ChatActor,
    id: string,
  ): Promise<void>;
}