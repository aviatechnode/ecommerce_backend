import type { ChatActor } from "../interfaces/actor.interface.js";
import type {
  DeleteMessage,
  EditMessage,
  ListMessages,
  Message,
  ReplyMessage,
  SendMessage,
} from "../schema_types/message.type.js";

export interface IMessageGateway {
  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: SendMessage,
  ): Promise<Message>;

  reply(
    actor: ChatActor,
    data: ReplyMessage,
  ): Promise<Message>;

  ////////////////////////////////////////////////////////////
  // UPDATE
  ////////////////////////////////////////////////////////////

  update(
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

  findMany(
    actor: ChatActor,
    filters: ListMessages,
  ): Promise<Message[]>;

  count(
    actor: ChatActor,
    conversationId: string,
  ): Promise<number>;

  findReplies(
    actor: ChatActor,
    messageId: string,
  ): Promise<Message[]>;

  ////////////////////////////////////////////////////////////
  // INTERNAL
  ////////////////////////////////////////////////////////////

  updateDeliveryStatus(
    actor: ChatActor,
    messageId: string,
    status: Message["deliveryStatus"],
  ): Promise<Message>;

  updateReadAt(
    actor: ChatActor,
    messageId: string,
    readAt: Date,
  ): Promise<Message>;
}