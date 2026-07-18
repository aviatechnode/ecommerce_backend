import type { ChatActor } from "./actor.interface.js";
import type {
  DeleteMessage,
  EditMessage,
  ListMessages,
  Message,
  ReplyMessage,
  SendMessage,
} from "../schemas/message.schema.js";

export interface IMessageService {
  ////////////////////////////////////////////////////////////
  // SEND
  ////////////////////////////////////////////////////////////

  send(
    actor: ChatActor,
    data: SendMessage,
  ): Promise<Message>;

  reply(
    actor: ChatActor,
    data: ReplyMessage,
  ): Promise<Message>;

  ////////////////////////////////////////////////////////////
  // EDIT
  ////////////////////////////////////////////////////////////

  edit(
    actor: ChatActor,
    data: EditMessage,
  ): Promise<Message>;

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  delete(
    actor: ChatActor,
    data: DeleteMessage,
  ): Promise<void>;

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<Message | null>;

  list(
    actor: ChatActor,
    filters: ListMessages,
  ): Promise<{
    data: Message[];
    total: number;
  }>;

  findReplies(
    actor: ChatActor,
    messageId: string,
  ): Promise<Message[]>;

  ////////////////////////////////////////////////////////////
  // READ RECEIPTS
  ////////////////////////////////////////////////////////////

  markRead(
    actor: ChatActor,
    messageId: string,
  ): Promise<Message>;

  markDelivered(
    actor: ChatActor,
    messageId: string,
  ): Promise<Message>;
}