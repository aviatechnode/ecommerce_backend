import type { ChatActor } from "../interfaces/actor.interface.js";
import type { 
    MessageDraft, 
    SaveMessageDraft 
} from "../schema_types/message-draft.type.js";

export interface IMessageDraftGateway {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  save(
    actor: ChatActor,
    data: SaveMessageDraft,
  ): Promise<MessageDraft>;

  find(
    actor: ChatActor,
    conversationId: string,
  ): Promise<MessageDraft | null>;

  delete(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void>;
}