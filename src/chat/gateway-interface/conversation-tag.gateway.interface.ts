import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  ConversationTag,
  CreateTag,
  UpdateTag,
  AssignTag,
  RemoveTag,
} from "../schema_types/conversation-tag.type.js";

export interface IConversationTagGateway {
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

  findByName(
    actor: ChatActor,
    name: string,
  ): Promise<ConversationTag | null>;

  findMany(): Promise<ConversationTag[]>;

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

  findByConversation(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationTag[]>;
}