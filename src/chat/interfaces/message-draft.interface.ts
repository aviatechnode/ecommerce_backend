import type { ChatActor } from "./actor.interface.js";
import type {
  MessageDraft,
  SaveMessageDraft,
  DeleteMessageDraft,
  GetMessageDraft,
} from "../schemas/message-draft.schema.js";

export interface IMessageDraftService {
  ////////////////////////////////////////////////////////////
  // DRAFTS
  ////////////////////////////////////////////////////////////

  save(
    actor: ChatActor,
    data: SaveMessageDraft,
  ): Promise<MessageDraft>;

  get(
    actor: ChatActor,
    data: GetMessageDraft,
  ): Promise<MessageDraft | null>;

  delete(
    actor: ChatActor,
    data: DeleteMessageDraft,
  ): Promise<void>;

  ////////////////////////////////////////////////////////////
  // BUSINESS LOGIC
  ////////////////////////////////////////////////////////////

  restore(
    actor: ChatActor,
    conversationId: string,
  ): Promise<MessageDraft | null>;

  clearAfterSend(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void>;
}