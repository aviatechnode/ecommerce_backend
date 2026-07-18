import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { ISupportTeamEventGateway } from "../gateway-interface/support-team-event.gateway.interface.js";

import type { ChatActor } from "../interfaces/actor.interface.js";
import type { ISupportTeamEventService } from "../interfaces/support-team-event.interface.js";

import { SupportTeamEventPolicy } from "../policies/support-team-event-policy.js";

import { SupportTeamEvents } from "../chat-event/support-chat-event.js";

import type {
  FindSupportTeamEvent,
  ListSupportTeamEvents,
  RecordSupportTeamEvent,
  SupportTeamEvent,
} from "../schema_types/support-team-event.type.js";

export class SupportTeamEventService
  implements ISupportTeamEventService
{
  constructor(
    private readonly gateway: ISupportTeamEventGateway,

    private readonly policy: SupportTeamEventPolicy,
  ) {}

  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  async record(
    actor: ChatActor,
    data: RecordSupportTeamEvent,
  ): Promise<SupportTeamEvent> {
    this.policy.record(
      actor,
      data,
    );

    return this.gateway.create(
      actor,
      data,
    );
  }

  async findById(
    actor: ChatActor,
    data: FindSupportTeamEvent,
  ): Promise<SupportTeamEvent | null> {
    const event =
      await this.gateway.findById(
        actor,
        data.eventId,
      );

    if (!event) {
      return null;
    }

    this.policy.view(
      actor,
      event,
    );

    return event;
  }

  async list(
    actor: ChatActor,
    filters: ListSupportTeamEvents,
  ): Promise<SupportTeamEvent[]> {
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
  // BUSINESS EVENTS
  ////////////////////////////////////////////////////////////

  async recordCreated(
  actor: ChatActor,
  teamId: string,
): Promise<SupportTeamEvent> {
  return this.record(actor, {
    teamId,
    type: SupportTeamEvents.TEAM_CREATED,
    actorId: actor.isAuthenticated
      ? actor.userId
      : undefined,
  });
}

async recordUpdated(
  actor: ChatActor,
  teamId: string,
  oldValue: unknown,
  newValue: unknown,
): Promise<SupportTeamEvent> {
  return this.record(actor, {
    teamId,
    type: SupportTeamEvents.TEAM_UPDATED,
    actorId: actor.isAuthenticated
      ? actor.userId
      : undefined,
    oldValue,
    newValue,
  });
}

async recordMemberAdded(
  actor: ChatActor,
  teamId: string,
  userId: string,
): Promise<SupportTeamEvent> {
  return this.record(actor, {
    teamId,
    type: SupportTeamEvents.MEMBER_ADDED,
    userId,
    actorId: actor.isAuthenticated
      ? actor.userId
      : undefined,
  });
}

async recordMemberRemoved(
  actor: ChatActor,
  teamId: string,
  userId: string,
): Promise<SupportTeamEvent> {
  return this.record(actor, {
    teamId,
    type: SupportTeamEvents.MEMBER_REMOVED,
    userId,
    actorId: actor.isAuthenticated
      ? actor.userId
      : undefined,
  });
}

async recordMemberRoleChanged(
  actor: ChatActor,
  teamId: string,
  userId: string,
  oldValue: unknown,
  newValue: unknown,
): Promise<SupportTeamEvent> {
  return this.record(actor, {
    teamId,
    type: SupportTeamEvents.MEMBER_ROLE_CHANGED,
    userId,
    actorId: actor.isAuthenticated
      ? actor.userId
      : undefined,
    oldValue,
    newValue,
  });
}

async recordMemberActivated(
  actor: ChatActor,
  teamId: string,
  userId: string,
): Promise<SupportTeamEvent> {
  return this.record(actor, {
    teamId,
    type: SupportTeamEvents.MEMBER_ACTIVATED,
    userId,
    actorId: actor.isAuthenticated
      ? actor.userId
      : undefined,
  });
}

async recordMemberDeactivated(
  actor: ChatActor,
  teamId: string,
  userId: string,
): Promise<SupportTeamEvent> {
  return this.record(actor, {
    teamId,
    type: SupportTeamEvents.MEMBER_DEACTIVATED,
    userId,
    actorId: actor.isAuthenticated
      ? actor.userId
      : undefined,
  });
}

async recordActivated(
  actor: ChatActor,
  teamId: string,
): Promise<SupportTeamEvent> {
  return this.record(actor, {
    teamId,
    type: SupportTeamEvents.TEAM_ACTIVATED,
    actorId: actor.isAuthenticated
      ? actor.userId
      : undefined,
  });
}

async recordDeactivated(
  actor: ChatActor,
  teamId: string,
): Promise<SupportTeamEvent> {
  return this.record(actor, {
    teamId,
    type: SupportTeamEvents.TEAM_DEACTIVATED,
    actorId: actor.isAuthenticated
      ? actor.userId
      : undefined,
  });
}
}