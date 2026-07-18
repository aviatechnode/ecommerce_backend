import type { ChatActor } from "../interfaces/actor.interface.js";
import type { 
  ConversationSLA, 
  UpdateSLA 
} from "../schema_types/conversation-sla.type.js";

export interface IConversationSLAGateway {
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
}