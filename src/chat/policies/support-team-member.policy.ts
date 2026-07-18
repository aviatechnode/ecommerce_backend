import { BusinessRuleError } from "../_shared/business-rule-error.js";
import type { ChatActor } from "../interfaces/actor.interface.js";
import type {
  AddSupportTeamMember,
  ChangeSupportTeamMemberRole,
  ListSupportTeamMembers,
  RemoveSupportTeamMember,
  SetSupportTeamMemberStatus,
  SupportTeamMember,
  UpdateSupportTeamMember,
} from "../schema_types/support-team-member.type.js";

import { BasePolicy } from "./base.policy.js";

export class SupportTeamMemberPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // MEMBERSHIP
  ////////////////////////////////////////////////////////////

  add(
    actor: ChatActor,
    _data: AddSupportTeamMember,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeamMember:create");
  }

  update(
    actor: ChatActor,
    member: SupportTeamMember,
    _data: UpdateSupportTeamMember,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeamMember:update");

    if (!member.isActive) {
      throw new BusinessRuleError(
        "Inactive members cannot be updated.",
      );
    }
  }

  remove(
    actor: ChatActor,
    member: SupportTeamMember,
    _data: RemoveSupportTeamMember,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeamMember:delete");

    if (!member.isActive) {
      throw new BusinessRuleError(
        "Member is already inactive.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // LOOKUPS
  ////////////////////////////////////////////////////////////

  view(
    actor: ChatActor,
    _member: SupportTeamMember,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeamMember:view");
  }

  list(
    actor: ChatActor,
    _filters: ListSupportTeamMembers,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeamMember:view");
  }

  ////////////////////////////////////////////////////////////
  // ROLE
  ////////////////////////////////////////////////////////////

  changeRole(
    actor: ChatActor,
    member: SupportTeamMember,
    _data: ChangeSupportTeamMemberRole,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeamMember:update");

    if (!member.isActive) {
      throw new BusinessRuleError(
        "Cannot change the role of an inactive member.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // STATUS
  ////////////////////////////////////////////////////////////

  activate(
    actor: ChatActor,
    member: SupportTeamMember,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeamMember:update");

    if (member.isActive) {
      throw new BusinessRuleError(
        "Member is already active.",
      );
    }
  }

  deactivate(
    actor: ChatActor,
    member: SupportTeamMember,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeamMember:update");

    if (!member.isActive) {
      throw new BusinessRuleError(
        "Member is already inactive.",
      );
    }
  }

  setStatus(
    actor: ChatActor,
    member: SupportTeamMember,
    data: SetSupportTeamMemberStatus,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeamMember:update");

    if (member.isActive === data.isActive) {
      throw new BusinessRuleError(
        data.isActive
          ? "Member is already active."
          : "Member is already inactive.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  isMember(
    actor: ChatActor,
    _teamId: string,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeamMember:view");
  }

  isActiveMember(
    actor: ChatActor,
    _teamId: string,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "supportTeamMember:view");
  }
}