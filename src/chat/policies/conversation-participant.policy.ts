import { BusinessRuleError } from "../_shared/business-rule-error.js";
import type { ChatActor } from "../interfaces/actor.interface.js";
import type {
  AddParticipant,
  ConversationParticipant,
  ListParticipants,
  MarkConversationRead,
  MuteParticipant,
  RemoveParticipant,
  UnreadCount,
} from "../schema_types/convsersation-participant.type.js";

import { BasePolicy } from "./base.policy.js";

export class ConversationParticipantPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // MEMBERSHIP
  ////////////////////////////////////////////////////////////

  add(
    actor: ChatActor,
    _data: AddParticipant,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationParticipant:add");
  }

  remove(
    actor: ChatActor,
    participant: ConversationParticipant,
    _data: RemoveParticipant,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationParticipant:remove");

    this.requireParticipantOwner(
      actor,
      participant,
    );
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  view(
    actor: ChatActor,
    participant: ConversationParticipant,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationParticipant:view");

    this.requireParticipantOwner(
      actor,
      participant,
    );
  }


    findByConversation(
    actor: ChatActor,
    _conversationId: string,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationParticipant:view");
  }

  list(
    actor: ChatActor,
    _data: ListParticipants,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationParticipant:view");
  }

  findByUser(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationParticipant:view");
  }

  ////////////////////////////////////////////////////////////
  // MUTE
  ////////////////////////////////////////////////////////////

  mute(
    actor: ChatActor,
    participant: ConversationParticipant,
    _data: MuteParticipant,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationParticipant:mute");

    this.requireParticipantOwner(
      actor,
      participant,
    );
  }

  ////////////////////////////////////////////////////////////
  // UNREAD
  ////////////////////////////////////////////////////////////

  updateUnreadCount(
    actor: ChatActor,
    participant: ConversationParticipant,
    _data: UnreadCount,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationParticipant:updateUnreadCount");

    this.requireParticipantOwner(
      actor,
      participant,
    );
  }

  incrementUnreadCount(
    actor: ChatActor,
    participant: ConversationParticipant,
  ): void {
    this.requireAuthenticated(actor);

    this.requireParticipantOwner(
      actor,
      participant,
    );
  }

  resetUnreadCount(
    actor: ChatActor,
    participant: ConversationParticipant,
  ): void {
    this.requireAuthenticated(actor);

    this.requireParticipantOwner(
      actor,
      participant,
    );
  }

  ////////////////////////////////////////////////////////////
  // READ
  ////////////////////////////////////////////////////////////

  markConversationRead(
    actor: ChatActor,
    participant: ConversationParticipant,
    _data: MarkConversationRead,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationParticipant:markRead");

    this.requireParticipantOwner(
      actor,
      participant,
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private requireParticipantOwner(
    actor: ChatActor,
    participant: ConversationParticipant,
  ): void {
    if (actor.isSuperAdmin) {
      return;
    }

    const userId = this.requireUser(actor);

    if (participant.userId !== userId) {
      throw new BusinessRuleError(
        "You can only modify your own participant record.",
      );
    }
  }
}