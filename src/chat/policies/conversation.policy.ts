import { BusinessRuleError } from "../_shared/business-rule-error.js";
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

import { BasePolicy } from "./base.policy.js";

export class ConversationPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    _data: CreateConversation,
  ): void {
    if (actor.isGuest) {
      return;
    }

    this.requireAuthenticated(actor);
    this.require(actor, "conversation:create");
  }

  view(
    actor: ChatActor,
    _conversation: Conversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:view");
  }

  list(
    actor: ChatActor,
    _filters?: ConversationFilters,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:view");
  }

  update(
    actor: ChatActor,
    conversation: Conversation,
    _data: UpdateConversationDetails,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:update");

    this.ensureUnlocked(conversation);
  }

  delete(
    actor: ChatActor,
    conversation: Conversation,
    _data: DeleteConversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:delete");

    this.ensureUnlocked(conversation);
  }

  ////////////////////////////////////////////////////////////
  // ASSIGNMENT
  ////////////////////////////////////////////////////////////

  assign(
    actor: ChatActor,
    conversation: Conversation,
    _data: AssignConversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:assign");

    this.ensureUnlocked(conversation);
  }

  transfer(
    actor: ChatActor,
    conversation: Conversation,
    _data: TransferConversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:transfer");

    this.ensureUnlocked(conversation);
  }

  ////////////////////////////////////////////////////////////
  // STATUS
  ////////////////////////////////////////////////////////////

  updateStatus(
    actor: ChatActor,
    conversation: Conversation,
    _data: UpdateConversationStatus,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:updateStatus");

    this.ensureUnlocked(conversation);
  }

  updatePriority(
    actor: ChatActor,
    conversation: Conversation,
    _data: UpdateConversationPriority,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:updatePriority");

    this.ensureUnlocked(conversation);
  }

  resolve(
    actor: ChatActor,
    conversation: Conversation,
    _data: ResolveConversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:resolve");

    this.ensureUnlocked(conversation);

    if (conversation.resolvedAt) {
      throw new BusinessRuleError(
        "Conversation has already been resolved.",
      );
    }
  }

  close(
    actor: ChatActor,
    conversation: Conversation,
    _data: CloseConversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:close");

    this.ensureUnlocked(conversation);

    if (conversation.closedAt) {
      throw new BusinessRuleError(
        "Conversation has already been closed.",
      );
    }
  }

  reopen(
    actor: ChatActor,
    conversation: Conversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:reopen");

    this.ensureUnlocked(conversation);

    if (!conversation.closedAt) {
      throw new BusinessRuleError(
        "Conversation is not closed.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // LIFECYCLE
  ////////////////////////////////////////////////////////////

  archive(
    actor: ChatActor,
    conversation: Conversation,
    _data: ArchiveConversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:archive");

    if (conversation.archivedAt) {
      throw new BusinessRuleError(
        "Conversation has already been archived.",
      );
    }
  }

  restore(
    actor: ChatActor,
    conversation: Conversation,
    _data: RestoreConversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:restore");

    if (!conversation.archivedAt) {
      throw new BusinessRuleError(
        "Conversation is not archived.",
      );
    }
  }

  lock(
    actor: ChatActor,
    conversation: Conversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:lock");

    if (conversation.isLocked) {
      throw new BusinessRuleError(
        "Conversation is already locked.",
      );
    }
  }

  unlock(
    actor: ChatActor,
    conversation: Conversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:unlock");

    if (!conversation.isLocked) {
      throw new BusinessRuleError(
        "Conversation is not locked.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // RATING
  ////////////////////////////////////////////////////////////

  rate(
    actor: ChatActor,
    conversation: Conversation,
    _data: RateConversation,
  ): void {
    if (!actor.isGuest) {
      this.requireAuthenticated(actor);
      this.require(actor, "conversation:rate");
    }

    if (!conversation.closedAt) {
      throw new BusinessRuleError(
        "Only closed conversations can be rated.",
      );
    }

    if (conversation.customerRating !== null) {
      throw new BusinessRuleError(
        "Conversation has already been rated.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // ADVANCED
  ////////////////////////////////////////////////////////////

  merge(
    actor: ChatActor,
    source: Conversation,
    target: Conversation,
    _data: MergeConversation,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversation:merge");

    this.ensureUnlocked(source);
    this.ensureUnlocked(target);

    if (source.id === target.id) {
      throw new BusinessRuleError(
        "Cannot merge a conversation into itself.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private ensureUnlocked(
    conversation: Conversation,
  ): void {
    if (conversation.isLocked) {
      throw new BusinessRuleError(
        "Locked conversations cannot be modified.",
      );
    }
  }
}