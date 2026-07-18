import { BusinessRuleError } from "../_shared/business-rule-error.js";
import type { ChatActor } from "../interfaces/actor.interface.js";
import type {
  ConversationSLA,
  UpdateSLA,
} from "../schema_types/conversation-sla.type.js";

import { BasePolicy } from "./base.policy.js";

export class ConversationSLAPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    _conversationId: string,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationSLA:create");
  }

  view(
    actor: ChatActor,
    _sla: ConversationSLA,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationSLA:view");
  }

  update(
    actor: ChatActor,
    sla: ConversationSLA,
    _data: UpdateSLA,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationSLA:update");

    if (sla.resolvedAt) {
      throw new BusinessRuleError(
        "Resolved SLAs cannot be updated.",
      );
    }
  }

  delete(
    actor: ChatActor,
    _sla: ConversationSLA,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationSLA:delete");
  }

  ////////////////////////////////////////////////////////////
  // SLA EVENTS
  ////////////////////////////////////////////////////////////

  markFirstResponseBreached(
    actor: ChatActor,
    sla: ConversationSLA,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationSLA:update");

    if (sla.breachedFirstResponse) {
      throw new BusinessRuleError(
        "First response breach has already been recorded.",
      );
    }
  }

  markResolutionBreached(
    actor: ChatActor,
    sla: ConversationSLA,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationSLA:update");

    if (sla.breachedResolution) {
      throw new BusinessRuleError(
        "Resolution breach has already been recorded.",
      );
    }
  }

  markFirstResponded(
    actor: ChatActor,
    sla: ConversationSLA,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationSLA:update");

    if (sla.firstRespondedAt) {
      throw new BusinessRuleError(
        "First response has already been recorded.",
      );
    }
  }

  markResolved(
    actor: ChatActor,
    sla: ConversationSLA,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "conversationSLA:update");

    if (sla.resolvedAt) {
      throw new BusinessRuleError(
        "Conversation has already been resolved.",
      );
    }
  }
}