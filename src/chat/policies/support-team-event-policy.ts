import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  RecordSupportTeamEvent,
  ListSupportTeamEvents,
  SupportTeamEvent,
} from "../schema_types/support-team-event.type.js";

import { BasePolicy } from "./base.policy.js";

export class SupportTeamEventPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // EVENTS
  ////////////////////////////////////////////////////////////

  record(
    actor: ChatActor,
    _data: RecordSupportTeamEvent,
  ): void {
    this.requireAuthenticated(actor);

    this.require(
      actor,
      "supportTeamEvent:create",
    );
  }

  view(
    actor: ChatActor,
    _event: SupportTeamEvent,
  ): void {
    this.requireAuthenticated(actor);

    this.require(
      actor,
      "supportTeamEvent:view",
    );
  }

  list(
    actor: ChatActor,
    _filters: ListSupportTeamEvents,
  ): void {
    this.requireAuthenticated(actor);

    this.require(
      actor,
      "supportTeamEvent:view",
    );
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS RULES
  ////////////////////////////////////////////////////////////

  ensureTeamMatches(
    event: SupportTeamEvent,
    teamId: string,
  ): void {
    if (event.teamId !== teamId) {
      throw new BusinessRuleError(
        "Support team event does not belong to the specified team.",
      );
    }
  }
}