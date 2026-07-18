import { BusinessRuleError } from "../_shared/business-rule-error.js";
import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  GetUserPresence,
  UpdatePresence,
  UpdateTyping,
  UserPresence,
} from "../schema_types/user-presence.type.js";

import { BasePolicy } from "./base.policy.js";

export class UserPresencePolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // PRESENCE
  ////////////////////////////////////////////////////////////

  updatePresence(
    actor: ChatActor,
    _data: UpdatePresence,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "userPresence:update");
    this.requireUser(actor);
  }

  getPresence(
    actor: ChatActor,
    _data: GetUserPresence,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "userPresence:view");
  }

  ////////////////////////////////////////////////////////////
  // TYPING
  ////////////////////////////////////////////////////////////

  updateTyping(
    actor: ChatActor,
    _data: UpdateTyping,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "userPresence:updateTyping");
    this.requireUser(actor);
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS LOGIC
  ////////////////////////////////////////////////////////////

  refreshHeartbeat(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "userPresence:update");
    this.requireUser(actor);
  }

  setOnline(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "userPresence:update");
    this.requireUser(actor);
  }

  setAway(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "userPresence:update");
    this.requireUser(actor);
  }

  setOffline(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "userPresence:update");
    this.requireUser(actor);
  }

  clearTyping(
    actor: ChatActor,
    _conversationId: string,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "userPresence:updateTyping");
    this.requireUser(actor);
  }

  ////////////////////////////////////////////////////////////
  // OWNERSHIP
  ////////////////////////////////////////////////////////////

  modify(
    actor: ChatActor,
    presence: UserPresence,
  ): void {
    this.requireAuthenticated(actor);

    if (
      !actor.isSuperAdmin &&
      actor.userId !== presence.userId
    ) {
      throw new BusinessRuleError(
        "You may only modify your own presence."
      );
    }
  }
}