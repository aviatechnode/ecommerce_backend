import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  CreateSupportTeam,
  SupportTeam,
  UpdateSupportTeam,
} from "../schema_types/support-team.type.js";

import { BasePolicy } from "./base.policy.js";

export class SupportTeamPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // TEAM
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    _data: CreateSupportTeam,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeam:create");
  }

  update(
    actor: ChatActor,
    team: SupportTeam,
    _data: UpdateSupportTeam,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeam:update");

    if (!team.isActive) {
      throw new BusinessRuleError(
        "Inactive teams cannot be updated.",
      );
    }
  }

  view(
    actor: ChatActor,
    _team: SupportTeam,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeam:view");
  }

  list(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeam:view");
  }

  delete(
    actor: ChatActor,
    team: SupportTeam,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeam:delete");

    if (team.isActive) {
      throw new BusinessRuleError(
        "Deactivate the team before deleting it.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS OPERATIONS
  ////////////////////////////////////////////////////////////

  activate(
    actor: ChatActor,
    team: SupportTeam,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeam:update");

    if (team.isActive) {
      throw new BusinessRuleError(
        "Team is already active.",
      );
    }
  }

  deactivate(
    actor: ChatActor,
    team: SupportTeam,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeam:update");

    if (!team.isActive) {
      throw new BusinessRuleError(
        "Team is already inactive.",
      );
    }
  }
}