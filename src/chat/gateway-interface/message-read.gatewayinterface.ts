import type { ChatActor } from "../interfaces/actor.interface.js";
import type { 
    ListMessageReads, 
    MarkMessageRead, 
    MessageRead 
} from "../schema_types/message-read.type.js";

export interface IMessageReadGateway {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: MarkMessageRead,
  ): Promise<MessageRead>;

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<MessageRead | null>;

  find(
    actor: ChatActor,
    messageId: string,
  ): Promise<MessageRead | null>;

  list(
    actor: ChatActor,
    filters: ListMessageReads,
  ): Promise<MessageRead[]>;

  delete(
    actor: ChatActor,
    messageId: string,
  ): Promise<void>;

 markConversationRead(
  actor: ChatActor,
  conversationId: string,
): Promise<void>;

markMessagesRead(
  actor: ChatActor,
  messageIds: string[],
): Promise<void>;

count(
  actor: ChatActor,
  messageId: string,
): Promise<number>;
}