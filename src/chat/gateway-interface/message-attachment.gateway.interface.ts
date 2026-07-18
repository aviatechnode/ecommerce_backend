import type { ChatActor } from "../interfaces/actor.interface.js";
import type {
  MessageAttachment,
  UploadAttachment,
  SearchAttachments,
} from "../schema_types/message-attachment.type.js";

export interface IMessageAttachmentGateway {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: UploadAttachment,
  ): Promise<MessageAttachment>;

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<MessageAttachment | null>;

  findByMessage(
    actor: ChatActor,
    messageId: string,
  ): Promise<MessageAttachment[]>;

  search(
    actor: ChatActor,
    filters: SearchAttachments,
  ): Promise<MessageAttachment[]>;

  count(
    actor: ChatActor,
    filters?: Partial<SearchAttachments>,
  ): Promise<number>;

  delete(
    actor: ChatActor,
    attachmentId: string,
  ): Promise<void>;
}