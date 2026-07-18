import { BusinessRuleError } from "../_shared/business-rule-error.js";
import type { ChatActor } from "../interfaces/actor.interface.js";
import type {
  AssignTag,
  ConversationTag,
  CreateTag,
  RemoveTag,
  UpdateTag,
} from "../schema_types/conversation-tag.type.js";

import { BasePolicy } from "./base.policy.js";

export class ConversationTagPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // TAG CRUD
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    _data: CreateTag,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationTag:create");
  }

  update(
    actor: ChatActor,
    tag: ConversationTag,
    _data: UpdateTag,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationTag:update");

    if (tag.isSystem) {
      throw new BusinessRuleError(
        "System tags cannot be modified.",
      );
    }
  }

  view(
    actor: ChatActor,
    _tag: ConversationTag,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationTag:view");
  }

  list(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationTag:view");
  }

  delete(
    actor: ChatActor,
    tag: ConversationTag,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationTag:delete");

    if (tag.isSystem) {
      throw new BusinessRuleError(
        "System tags cannot be deleted.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // CONVERSATION TAGS
  ////////////////////////////////////////////////////////////

  assign(
    actor: ChatActor,
    _tag: ConversationTag,
    _data: AssignTag,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationTag:assign");
  }

  remove(
    actor: ChatActor,
    _tag: ConversationTag,
    _data: RemoveTag,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationTag:remove");
  }

  listByConversation(
    actor: ChatActor,
    _conversationId: string,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationTag:view");
  }
}