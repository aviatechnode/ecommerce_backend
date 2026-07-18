import type { ChatActor } from "./actor.interface.js";
import type {
  SupportTeamMember,
  AddSupportTeamMember,
  UpdateSupportTeamMember,
  RemoveSupportTeamMember,
  ListSupportTeamMembers,
  ChangeSupportTeamMemberRole,
  SetSupportTeamMemberStatus,
} from "../schemas/support-team-member.schema.js";

export interface ISupportTeamMemberService {
  ////////////////////////////////////////////////////////////
  // MEMBERSHIP
  ////////////////////////////////////////////////////////////

  add(
    actor:ChatActor,
    data: AddSupportTeamMember,
  ): Promise<SupportTeamMember>;

  update(
    actor: ChatActor,
    data: UpdateSupportTeamMember,
  ): Promise<SupportTeamMember>;

  remove(
    actor: ChatActor,
    data: RemoveSupportTeamMember,
  ): Promise<void>;

  ////////////////////////////////////////////////////////////
  // LOOKUPS
  ////////////////////////////////////////////////////////////

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<SupportTeamMember | null>;

  list(
    actor: ChatActor,
    filters: ListSupportTeamMembers,
  ): Promise<SupportTeamMember[]>;

  ////////////////////////////////////////////////////////////
  // BUSINESS LOGIC
  ////////////////////////////////////////////////////////////

  changeRole(
    actor: ChatActor,
    data: ChangeSupportTeamMemberRole,
  ): Promise<SupportTeamMember>;

  activate(
    actor: ChatActor,
    memberId: string,
  ): Promise<SupportTeamMember>;

  deactivate(
    actor: ChatActor,
    memberId: string,
  ): Promise<SupportTeamMember>;

  setStatus(
    actor: ChatActor,
    data: SetSupportTeamMemberStatus,
  ): Promise<SupportTeamMember>;

  isMember(
    actor: ChatActor,
    teamId: string,
  ): Promise<boolean>;

  isActiveMember(
    actor: ChatActor,
    teamId: string,
  ): Promise<boolean>;
}