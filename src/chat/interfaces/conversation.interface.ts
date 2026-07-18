import type { ChatActor } from "./actor.interface.js";
import type {
  ArchiveConversation,
  AssignConversation,
  CloseConversation,
  Conversation,
  ConversationFilters,
  CreateConversation,
  DeleteConversation,
  MergeConversation,
  RateConversation,
  ResolveConversation,
  RestoreConversation,
  TransferConversation,
  UpdateConversationDetails,
  UpdateConversationPriority,
  UpdateConversationStatus,
} from "../schemas/conversation.schema.js";

export interface IConversationService {
  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: CreateConversation,
  ): Promise<Conversation>;

  ////////////////////////////////////////////////////////////
  // DETAILS
  ////////////////////////////////////////////////////////////

  updateDetails(
    actor: ChatActor,
    conversationId: string,
    data: UpdateConversationDetails,
  ): Promise<Conversation>;

  ////////////////////////////////////////////////////////////
  // READ
  ////////////////////////////////////////////////////////////

  findById(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation | null>;

  list(
    actor: ChatActor,
    filters?: ConversationFilters,
  ): Promise<{
    data: Conversation[];
    total: number;
  }>;

  ////////////////////////////////////////////////////////////
  // ASSIGNMENT
  ////////////////////////////////////////////////////////////

  assign(
    actor: ChatActor,
    data: AssignConversation,
  ): Promise<Conversation>;

  transfer(
    actor: ChatActor,
    data: TransferConversation,
  ): Promise<Conversation>;

  ////////////////////////////////////////////////////////////
  // STATUS
  ////////////////////////////////////////////////////////////

  updateStatus(
    actor: ChatActor,
    data: UpdateConversationStatus,
  ): Promise<Conversation>;

  updatePriority(
    actor: ChatActor,
    data: UpdateConversationPriority,
  ): Promise<Conversation>;

  exists(
    id: string,
  ): Promise<boolean>;

  resolve(
    actor: ChatActor,
    data: ResolveConversation,
  ): Promise<Conversation>;

  close(
    actor: ChatActor,
    data: CloseConversation,
  ): Promise<Conversation>;

  reopen(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation>;

  ////////////////////////////////////////////////////////////
  // LIFECYCLE
  ////////////////////////////////////////////////////////////

  archive(
    actor: ChatActor,
    data: ArchiveConversation,
  ): Promise<Conversation>;

  restore(
    actor: ChatActor,
    data: RestoreConversation,
  ): Promise<Conversation>;

  lock(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation>;

  unlock(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation>;

  delete(
    actor: ChatActor,
    data: DeleteConversation,
  ): Promise<void>;

  ////////////////////////////////////////////////////////////
  // CUSTOMER
  ////////////////////////////////////////////////////////////

  rate(
    actor: ChatActor,
    data: RateConversation,
  ): Promise<Conversation>;

  ////////////////////////////////////////////////////////////
  // ADVANCED
  ////////////////////////////////////////////////////////////

  merge(
    actor: ChatActor,
    data: MergeConversation,
  ): Promise<Conversation>;
}