import type { ChatActor } from "./actor.interface.js";
import type { 
  ListMessageReads, 
  MarkMessageRead, 
  MessageRead 
} from "../schemas/message-read.schema.js";

export interface IMessageReadService {
  ////////////////////////////////////////////////////////////
  // READ RECEIPTS
  ////////////////////////////////////////////////////////////

  markRead(
    actor: ChatActor,
    data: MarkMessageRead,
  ): Promise<MessageRead>;

  find(
    actor: ChatActor,
    messageId: string,
  ): Promise<MessageRead | null>;

  list(
    actor: ChatActor,
    filters: ListMessageReads,
  ): Promise<MessageRead[]>;

  ////////////////////////////////////////////////////////////
  // BUSINESS LOGIC
  ////////////////////////////////////////////////////////////

  markConversationRead(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void>;

  markMessagesRead(
    actor: ChatActor,
    messageIds: string[],
  ): Promise<void>;

  isRead(
    actor: ChatActor,
    messageId: string,
  ): Promise<boolean>;

  getReadCount(
    actor: ChatActor,
    messageId: string,
  ): Promise<number>;
}