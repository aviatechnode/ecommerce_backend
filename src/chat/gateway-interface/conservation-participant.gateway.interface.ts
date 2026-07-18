import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  ConversationParticipant,
  AddParticipant,
  RemoveParticipant,
  MuteParticipant,
  UnreadCount,
  MarkConversationRead,
  ListParticipants,
} from "../schema_types/convsersation-participant.type.js";

export interface IConversationParticipantGateway {
  ////////////////////////////////////////////////////////////
  // MEMBERSHIP
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: AddParticipant,
  ): Promise<ConversationParticipant>;

  list(
    actor: ChatActor,
    data: ListParticipants,
  ): Promise<ConversationParticipant[]>;

  delete(
    actor: ChatActor,
    data: RemoveParticipant,
  ): Promise<void>;

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<ConversationParticipant | null>;

    findByConversation(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationParticipant[]>;

  findByUser(
    actor: ChatActor,
  ): Promise<ConversationParticipant[]>;

  findParticipant(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationParticipant | null>;

  ////////////////////////////////////////////////////////////
  // MUTE
  ////////////////////////////////////////////////////////////

  mute(
    actor: ChatActor,
    data: MuteParticipant,
  ): Promise<ConversationParticipant>;

  ////////////////////////////////////////////////////////////
  // UNREAD
  ////////////////////////////////////////////////////////////
  incrementUnreadForOthers(
    actor: ChatActor,
    conversationId: string,
    excludedUserId: string,
): Promise<void>;

  updateUnreadCount(
    actor: ChatActor,
    data: UnreadCount,
  ): Promise<ConversationParticipant>;

    incrementUnreadCount(
    actor: ChatActor,
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipant>;

  resetUnreadCount(
    actor: ChatActor,
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipant>;

  ////////////////////////////////////////////////////////////
  // READ
  ////////////////////////////////////////////////////////////

  markConversationRead(
    actor: ChatActor,
    data: MarkConversationRead,
  ): Promise<ConversationParticipant>;
}

