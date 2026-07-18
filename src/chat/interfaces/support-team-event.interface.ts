import type { ChatActor } from "./actor.interface.js";

import type {
  SupportTeamEvent,
  RecordSupportTeamEvent,
  ListSupportTeamEvents,
  FindSupportTeamEvent,
} from "../schemas/events/support-team-event.schema.js";

export interface ISupportTeamEventService {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  record(
    actor: ChatActor,
    data: RecordSupportTeamEvent,
  ): Promise<SupportTeamEvent>;

  findById(
    actor: ChatActor,
    data: FindSupportTeamEvent,
  ): Promise<SupportTeamEvent | null>;

  list(
    actor: ChatActor,
    filters: ListSupportTeamEvents,
  ): Promise<SupportTeamEvent[]>;

  ////////////////////////////////////////////////////////////
  // BUSINESS EVENTS
  ////////////////////////////////////////////////////////////

  recordCreated(
    actor: ChatActor,
    teamId: string,
  ): Promise<SupportTeamEvent>;

  recordUpdated(
    actor: ChatActor,
    teamId: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<SupportTeamEvent>;

  recordActivated(
    actor: ChatActor,
    teamId: string,
  ): Promise<SupportTeamEvent>;

  recordDeactivated(
    actor: ChatActor,
    teamId: string,
  ): Promise<SupportTeamEvent>;

  ////////////////////////////////////////////////////////////
  // MEMBER EVENTS
  ////////////////////////////////////////////////////////////

  recordMemberAdded(
    actor: ChatActor,
    teamId: string,
    userId: string,
  ): Promise<SupportTeamEvent>;

  recordMemberRemoved(
    actor: ChatActor,
    teamId: string,
    userId: string,
  ): Promise<SupportTeamEvent>;

  recordMemberRoleChanged(
    actor: ChatActor,
    teamId: string,
    userId: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<SupportTeamEvent>;

  recordMemberActivated(
    actor: ChatActor,
    teamId: string,
    userId: string,
  ): Promise<SupportTeamEvent>;

  recordMemberDeactivated(
    actor: ChatActor,
    teamId: string,
    userId: string,
  ): Promise<SupportTeamEvent>;
}