import type { ChatActor } from "./actor.interface.js";

import type {
  ConversationSLA,
  UpdateSLA,
} from "../schemas/conversation-sla.schema.js";

export interface IConversationSLAService {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationSLA>;

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<ConversationSLA | null>;

  findByConversation(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationSLA | null>;

  update(
    actor: ChatActor,
    data: UpdateSLA,
  ): Promise<ConversationSLA>;

  delete(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void>;

  ////////////////////////////////////////////////////////////
  // SLA EVENTS
  ////////////////////////////////////////////////////////////

  markFirstResponseBreached(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationSLA>;

  markResolutionBreached(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationSLA>;

  markFirstResponded(
    actor: ChatActor,
    conversationId: string,
    respondedAt?: Date,
  ): Promise<ConversationSLA>;

  markResolved(
    actor: ChatActor,
    conversationId: string,
    resolvedAt?: Date,
  ): Promise<ConversationSLA>;
}