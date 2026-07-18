import type { ChatActor } from "./actor.interface.js";
import type {
  MessageAttachment,
  UploadAttachment,
  DeleteAttachment,
  ListAttachments,
  SearchAttachments,
} from "../schemas/message-attachment.schema.js";

export interface IMessageAttachmentService {
  ////////////////////////////////////////////////////////////
  // UPLOAD
  ////////////////////////////////////////////////////////////

  upload(
    actor: ChatActor,
    data: UploadAttachment,
  ): Promise<MessageAttachment>;

  ////////////////////////////////////////////////////////////
  // RETRIEVE
  ////////////////////////////////////////////////////////////

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<MessageAttachment | null>;

  list(
    actor: ChatActor,
    data: ListAttachments,
  ): Promise<MessageAttachment[]>;

  search(
    actor: ChatActor,
    filters: SearchAttachments,
  ): Promise<MessageAttachment[]>;

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  delete(
    actor: ChatActor,
    data: DeleteAttachment,
  ): Promise<void>;
}