import type { ChatActor } from "./actor.interface.js";
import type {
  ConversationTag,
  CreateTag,
  UpdateTag,
  AssignTag,
  RemoveTag,
} from "../schemas/conversation-tag.schema.js";

export interface IConversationTagService {
  ////////////////////////////////////////////////////////////
  // TAG CRUD
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: CreateTag,
  ): Promise<ConversationTag>;

  update(
    actor: ChatActor,
    data: UpdateTag,
  ): Promise<ConversationTag>;

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<ConversationTag | null>;

  list(): Promise<ConversationTag[]>;

  delete(
    actor: ChatActor,
    tagId: string,
  ): Promise<void>;

  ////////////////////////////////////////////////////////////
  // CONVERSATION TAGS
  ////////////////////////////////////////////////////////////

  assign(
    actor: ChatActor,
    data: AssignTag,
  ): Promise<void>;

  remove(
    actor: ChatActor,
    data: RemoveTag,
  ): Promise<void>;

  listByConversation(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationTag[]>;
}