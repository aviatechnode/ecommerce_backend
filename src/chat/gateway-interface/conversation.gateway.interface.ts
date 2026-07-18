import type { ChatActor } from "../interfaces/actor.interface.js";
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
} from "../schema_types/conversation.type.js";

export interface IConversationGateway {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: CreateConversation,
  ): Promise<Conversation>;

  update(
    actor: ChatActor,
    id: string,
    data: UpdateConversationDetails,
  ): Promise<Conversation>;

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<Conversation | null>;

  findMany(
    actor: ChatActor,
    filters?: ConversationFilters,
  ): Promise<Conversation[]>;

  count(
    actor: ChatActor,
    filters?: ConversationFilters,
  ): Promise<number>;

  findManyAndCount(
    actor: ChatActor,
    filters?: ConversationFilters,
  ): Promise<{
    data: Conversation[];
    total: number;
  }>;

  delete(
    actor: ChatActor,
    data: DeleteConversation,
  ): Promise<void>;

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

  ////////////////////////////////////////////////////////////
  // RATING
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

  ////////////////////////////////////////////////////////////
  // LOOKUPS
  ////////////////////////////////////////////////////////////

  findByCustomer(
    actor: ChatActor,
    customerId: string,
  ): Promise<Conversation[]>;

  findByGuestSession(
    actor: ChatActor,
    guestSessionId: string,
  ): Promise<Conversation[]>;

  findByAssignee(
    actor: ChatActor,
    assignedUserId: string,
  ): Promise<Conversation[]>;

  findByTeam(
    actor: ChatActor,
    teamId: string,
  ): Promise<Conversation[]>;

  ////////////////////////////////////////////////////////////
  // LAST MESSAGE
  ////////////////////////////////////////////////////////////

  updateLastMessage(
    actor: ChatActor,
    conversationId: string,
    messageId: string,
  ): Promise<void>;
}