import { BusinessRuleError } from "../_shared/business-rule-error.js";
import type { ChatActor } from "../interfaces/actor.interface.js";
import type {
  ListMessageReads,
  MarkMessageRead,
  MessageRead,
} from "../schema_types/message-read.type.js";

import { BasePolicy } from "./base.policy.js";

export class MessageReadPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // READ RECEIPTS
  ////////////////////////////////////////////////////////////

  markRead(
    actor: ChatActor,
    data: MarkMessageRead,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageRead:create");

    if (
      !actor.isSuperAdmin &&
      data.userId !== this.requireUser(actor)
    ) {
      throw new BusinessRuleError(
        "You can only mark messages as read for yourself.",
      );
    }
  }

  view(
    actor: ChatActor,
    read: MessageRead,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageRead:view");

    this.requireReadOwner(actor, read);
  }

  list(
    actor: ChatActor,
    _filters: ListMessageReads,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageRead:view");
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS LOGIC
  ////////////////////////////////////////////////////////////

  markConversationRead(
    actor: ChatActor,
    _conversationId: string,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageRead:create");

    this.requireUser(actor);
  }

  markMessagesRead(
    actor: ChatActor,
    _messageIds: string[],
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageRead:create");

    this.requireUser(actor);
  }

  isRead(
    actor: ChatActor,
    read: MessageRead,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageRead:view");

    this.requireReadOwner(actor, read);
  }

  getReadCount(
    actor: ChatActor,
    _messageId: string,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageRead:view");
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private requireReadOwner(
    actor: ChatActor,
    read: MessageRead,
  ): void {
    if (actor.isSuperAdmin) {
      return;
    }

    const userId = this.requireUser(actor);

    if (read.userId !== userId) {
      throw new BusinessRuleError(
        "You can only access your own message read receipts.",
      );
    }
  }
}