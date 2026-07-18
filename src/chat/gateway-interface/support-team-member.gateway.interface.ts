import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  SupportTeamMember,
  AddSupportTeamMember,
  UpdateSupportTeamMember,
  RemoveSupportTeamMember,
  ListSupportTeamMembers,
} from "../schema_types/support-team-member.type.js";

export interface ISupportTeamMemberGateway {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: AddSupportTeamMember,
  ): Promise<SupportTeamMember>;

  update(
    actor: ChatActor,
    data: UpdateSupportTeamMember,
  ): Promise<SupportTeamMember>;

  findById(
    actor: ChatActor,
    memberId: string,
  ): Promise<SupportTeamMember | null>;

  delete(
    actor: ChatActor,
    data: RemoveSupportTeamMember,
  ): Promise<void>;

  ////////////////////////////////////////////////////////////
  // LOOKUPS
  ////////////////////////////////////////////////////////////

  findMany(
    actor: ChatActor,
    filters: ListSupportTeamMembers,
  ): Promise<SupportTeamMember[]>;

  findByUser(
    actor: ChatActor,
    userId: string,
  ): Promise<SupportTeamMember[]>;

  findByTeam(
    actor: ChatActor,
    teamId: string,
  ): Promise<SupportTeamMember[]>;

  findMembership(
    actor: ChatActor,
    teamId: string,
    userId: string,
  ): Promise<SupportTeamMember | null>;
}