import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { ISupportTeamMemberGateway } from "../gateway-interface/support-team-member.gateway.interface.js";

import { requireAuthenticated,type ChatActor } from "../interfaces/actor.interface.js";
import type { ISupportTeamMemberService } from "../interfaces/support-team-member.interface.js";

import { SupportTeamMemberPolicy } from "../policies/support-team-member.policy.js";

import type {
  AddSupportTeamMember,
  ChangeSupportTeamMemberRole,
  ListSupportTeamMembers,
  RemoveSupportTeamMember,
  SetSupportTeamMemberStatus,
  SupportTeamMember,
  UpdateSupportTeamMember,
} from "../schema_types/support-team-member.type.js";

export class SupportTeamMemberService
  implements ISupportTeamMemberService
{
  constructor(
    private readonly gateway: ISupportTeamMemberGateway,

    private readonly policy: SupportTeamMemberPolicy,
  ) {}

  ////////////////////////////////////////////////////////////
  // MEMBERSHIP
  ////////////////////////////////////////////////////////////

  async add(
    actor: ChatActor,
    data: AddSupportTeamMember,
  ): Promise<SupportTeamMember> {
    this.policy.add(actor, data);

    return this.gateway.create(
      actor,
      data,
    );
  }

  async update(
    actor: ChatActor,
    data: UpdateSupportTeamMember,
  ): Promise<SupportTeamMember> {
    const member =
      await this.requireMember(
        actor,
        data.memberId,
      );

    this.policy.update(
      actor,
      member,
      data,
    );

    return this.gateway.update(
      actor,
      data,
    );
  }

  async remove(
    actor: ChatActor,
    data: RemoveSupportTeamMember,
  ): Promise<void> {
    const member =
      await this.requireMember(
        actor,
        data.memberId,
      );

    this.policy.remove(
      actor,
      member,
      data,
    );

    await this.gateway.delete(
      actor,
      data,
    );
  }

  ////////////////////////////////////////////////////////////
  // LOOKUPS
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<SupportTeamMember | null> {
    const member =
      await this.gateway.findById(
        actor,
        id,
      );

    if (!member) {
      return null;
    }

    this.policy.view(
      actor,
      member,
    );

    return member;
  }

  async list(
    actor: ChatActor,
    filters: ListSupportTeamMembers,
  ): Promise<SupportTeamMember[]> {
    this.policy.list(
      actor,
      filters,
    );

    return this.gateway.findMany(
      actor,
      filters,
    );
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS LOGIC
  ////////////////////////////////////////////////////////////

  async changeRole(
    actor: ChatActor,
    data: ChangeSupportTeamMemberRole,
  ): Promise<SupportTeamMember> {
    const member =
      await this.requireMember(
        actor,
        data.memberId,
      );

    this.policy.changeRole(
      actor,
      member,
      data,
    );

    return this.gateway.update(
      actor,
      {
        memberId: data.memberId,
        roleId: data.roleId,
      },
    );
  }

  async activate(
    actor: ChatActor,
    memberId: string,
  ): Promise<SupportTeamMember> {
    const member =
      await this.requireMember(
        actor,
        memberId,
      );

    this.policy.activate(
      actor,
      member,
    );

    return this.gateway.update(
      actor,
      {
        memberId,
        isActive: true,
      },
    );
  }

  async deactivate(
    actor: ChatActor,
    memberId: string,
  ): Promise<SupportTeamMember> {
    const member =
      await this.requireMember(
        actor,
        memberId,
      );

    this.policy.deactivate(
      actor,
      member,
    );

    return this.gateway.update(
      actor,
      {
        memberId,
        isActive: false,
      },
    );
  }

  async setStatus(
    actor: ChatActor,
    data: SetSupportTeamMemberStatus,
  ): Promise<SupportTeamMember> {
    const member =
      await this.requireMember(
        actor,
        data.memberId,
      );

    this.policy.setStatus(
      actor,
      member,
      data,
    );

    return this.gateway.update(
      actor,
      {
        memberId: data.memberId,
        isActive: data.isActive,
      },
    );
  }

 async isMember(
  actor: ChatActor,
  teamId: string,
): Promise<boolean> {
  this.policy.isMember(
    actor,
    teamId,
  );

  requireAuthenticated(actor);

  const member =
    await this.gateway.findMembership(
      actor,
      teamId,
      actor.userId,
    );

  return member !== null;
}

  async isActiveMember(
  actor: ChatActor,
  teamId: string,
): Promise<boolean> {
  this.policy.isActiveMember(
    actor,
    teamId,
  );

  requireAuthenticated(actor);

  const member =
    await this.gateway.findMembership(
      actor,
      teamId,
      actor.userId,
    );

  return member?.isActive ?? false;
}
  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private async requireMember(
    actor: ChatActor,
    memberId: string,
  ): Promise<SupportTeamMember> {
    const member =
      await this.gateway.findById(
        actor,
        memberId,
      );

    if (!member) {
      throw new BusinessRuleError(
        "Support team member not found.",
      );
    }

    return member;
  }
}