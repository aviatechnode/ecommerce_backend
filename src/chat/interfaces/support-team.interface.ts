import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  SupportTeam,
  CreateSupportTeam,
  UpdateSupportTeam,
} from "../schema_types/support-team.type.js";

export interface ISupportTeamService {
  ////////////////////////////////////////////////////////////
  // TEAM
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: CreateSupportTeam,
  ): Promise<SupportTeam>;

  update(
    actor: ChatActor,
    data: UpdateSupportTeam,
  ): Promise<SupportTeam>;

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<SupportTeam | null>;

  list(
    actor: ChatActor,
  ): Promise<SupportTeam[]>;

  delete(
    actor: ChatActor,
    id: string,
  ): Promise<void>;

  ////////////////////////////////////////////////////////////
  // BUSINESS OPERATIONS
  ////////////////////////////////////////////////////////////

  activate(
    actor: ChatActor,
    teamId: string,
  ): Promise<SupportTeam>;

  deactivate(
    actor: ChatActor,
    teamId: string,
  ): Promise<SupportTeam>;
}