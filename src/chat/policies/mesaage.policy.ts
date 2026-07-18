import { BusinessRuleError } from "../_shared/business-rule-error.js";
import type { ChatActor } from "../interfaces/actor.interface.js";
import type {
  DeleteMessage,
  EditMessage,
  ListMessages,
  Message,
  ReplyMessage,
  SendMessage,
  TypingEvent,
} from "../schema_types/message.type.js";
import { BasePolicy } from "./base.policy.js";

export class MessagePolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // SEND
  ////////////////////////////////////////////////////////////

  send(
    actor: ChatActor,
    _data: SendMessage,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "message:create");
  }

  reply(
    actor: ChatActor,
    _data: ReplyMessage,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "message:create");
  }

  ////////////////////////////////////////////////////////////
  // EDIT
  ////////////////////////////////////////////////////////////

  edit(
    actor: ChatActor,
    message: Message,
    _data: EditMessage,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "message:update");

    if (
      !actor.isSuperAdmin &&
      actor.userId !== message.senderId
    ) {
      throw new BusinessRuleError(
        "Only the sender can edit this message.",
      );
    }

    if (message.deletedAt) {
      throw new BusinessRuleError(
        "Deleted messages cannot be edited.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  delete(
    actor: ChatActor,
    message: Message,
    data: DeleteMessage,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "message:delete");

    if (
      !actor.isSuperAdmin &&
      actor.userId !== message.senderId
    ) {
      throw new BusinessRuleError(
        "Only the sender can delete this message.",
      );
    }

    if (
      data.hardDelete &&
      !actor.isSuperAdmin
    ) {
      throw new BusinessRuleError(
        "Only a super administrator may permanently delete messages.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // VIEW
  ////////////////////////////////////////////////////////////

  view(
    actor: ChatActor,
    _message: Message,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "message:view");
  }

  list(
    actor: ChatActor,
    _filters: ListMessages,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "message:view");
  }

  findReplies(
    actor: ChatActor,
    _message: Message,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "message:view");
  }

  ////////////////////////////////////////////////////////////
  // READ RECEIPTS
  ////////////////////////////////////////////////////////////

  markRead(
    actor: ChatActor,
    _message: Message,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "message:read");
  }

  markDelivered(
    actor: ChatActor,
    _message: Message,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "message:update");
  }

  ////////////////////////////////////////////////////////////
  // TYPING
  ////////////////////////////////////////////////////////////

  typing(
    actor: ChatActor,
    data: TypingEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "message:create");

    if (
      !actor.isSuperAdmin &&
      actor.userId !== data.userId
    ) {
      throw new BusinessRuleError(
        "You may only publish typing events for yourself.",
      );
    }
  }
}