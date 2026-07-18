import type { ISupportTeamGateway } from "../gateway-interface/support-team.gateway.interface.js";

import type { ChatActor } from "../interfaces/actor.interface.js";
import type { ISupportTeamService } from "../interfaces/support-team.interface.js";

import type { SupportTeamPolicy } from "../policies/support-team.policy.js";

import type {
  CreateSupportTeam,
  SupportTeam,
  UpdateSupportTeam,
} from "../schema_types/support-team.type.js";

import { BusinessRuleError } from "../_shared/business-rule-error.js";

export class SupportTeamService
  implements ISupportTeamService
{
  constructor(
    private readonly gateway: ISupportTeamGateway,
    private readonly policy: SupportTeamPolicy,
  ) {}

  ////////////////////////////////////////////////////////////
  // TEAM
  ////////////////////////////////////////////////////////////

  async create(
    actor: ChatActor,
    data: CreateSupportTeam,
  ): Promise<SupportTeam> {
    this.policy.create(actor, data);

    return this.gateway.create(
      actor,
      data,
    );
  }

  async update(
    actor: ChatActor,
    data: UpdateSupportTeam,
  ): Promise<SupportTeam> {
    const team =
      await this.requireTeam(
        actor,
        data.teamId,
      );

    this.policy.update(
      actor,
      team,
      data,
    );

    return this.gateway.update(
      actor,
      data,
    );
  }

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<SupportTeam | null> {
    const team =
      await this.gateway.findById(
        actor,
        id,
      );

    if (!team) {
      return null;
    }

    this.policy.view(
      actor,
      team,
    );

    return team;
  }

  async list(
    actor: ChatActor,
  ): Promise<SupportTeam[]> {
    this.policy.list(actor);

    return this.gateway.findMany(
      actor,
    );
  }

  async delete(
    actor: ChatActor,
    id: string,
  ): Promise<void> {
    const team =
      await this.requireTeam(
        actor,
        id,
      );

    this.policy.delete(
      actor,
      team,
    );

    await this.gateway.delete(
      actor,
      id,
    );
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS OPERATIONS
  ////////////////////////////////////////////////////////////

  async activate(
    actor: ChatActor,
    teamId: string,
  ): Promise<SupportTeam> {
    const team =
      await this.requireTeam(
        actor,
        teamId,
      );

    this.policy.activate(
      actor,
      team,
    );

    return this.gateway.update(
      actor,
      {
        teamId,
        isActive: true,
      },
    );
  }

  async deactivate(
    actor: ChatActor,
    teamId: string,
  ): Promise<SupportTeam> {
    const team =
      await this.requireTeam(
        actor,
        teamId,
      );

    this.policy.deactivate(
      actor,
      team,
    );

    return this.gateway.update(
      actor,
      {
        teamId,
        isActive: false,
      },
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private async requireTeam(
    actor: ChatActor,
    teamId: string,
  ): Promise<SupportTeam> {
    const team =
      await this.gateway.findById(
        actor,
        teamId,
      );

    if (!team) {
      throw new BusinessRuleError(
        "Support team not found.",
      );
    }

    return team;
  }
}