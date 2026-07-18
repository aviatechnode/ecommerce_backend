import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  SupportTeamEvent,
  RecordSupportTeamEvent,
  ListSupportTeamEvents,
} from "../schema_types/support-team-event.type.js";

export interface ISupportTeamEventGateway {
  ////////////////////////////////////////////////////////////
  // EVENTS
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: RecordSupportTeamEvent,
  ): Promise<SupportTeamEvent>;

  findById(
    actor: ChatActor,
    eventId: string,
  ): Promise<SupportTeamEvent | null>;

  findMany(
    actor: ChatActor,
    filters: ListSupportTeamEvents,
  ): Promise<SupportTeamEvent[]>;
}