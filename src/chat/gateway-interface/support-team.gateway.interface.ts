import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  SupportTeam,
  CreateSupportTeam,
  UpdateSupportTeam,
} from "../schema_types/support-team.type.js";

export interface ISupportTeamGateway {
  ////////////////////////////////////////////////////////////
  // TEAM CRUD
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

  findBySlug(
    actor: ChatActor,
    slug: string,
  ): Promise<SupportTeam | null>;

  findMany(
    actor: ChatActor,
  ): Promise<SupportTeam[]>;

  delete(
    actor: ChatActor,
    id: string,
  ): Promise<void>;
}