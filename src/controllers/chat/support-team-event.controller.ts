import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";

import {
  SupportTeamEventService,
} from "../../chat/services/support-event-team.service.js";

import type {
  RecordSupportTeamEvent,
} from "../../chat/schema_types/support-team-event.type.js";
import { ListSupportTeamEventsSchema } from "../../chat/schemas/events/support-team-event.schema.js";

////////////////////////////////////////////////////////////
// PARAMS
////////////////////////////////////////////////////////////

type EventParams = {
  eventId: string;
};

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

export class SupportTeamEventController {
  constructor(
    private readonly eventService:
      SupportTeamEventService,
  ) {}

  ////////////////////////////////////////////////////////////
  // ACTOR
  ////////////////////////////////////////////////////////////

  private actor(
    req: Request,
  ) {
    return toChatActor(
      req.user as AuthUser,
    );
  }

  ////////////////////////////////////////////////////////////
  // RECORD EVENT
  ////////////////////////////////////////////////////////////

  async record(
    req: TypedRequest<
      {},
      RecordSupportTeamEvent
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.record(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // FIND EVENT
  ////////////////////////////////////////////////////////////

  async findById(
    req: TypedRequest<
      EventParams
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.findById(
        this.actor(req),
        {
          eventId:
            req.params.eventId,
        },
      );

    if (!event) {
      res.sendStatus(404);
      return;
    }

    res.json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // LIST TEAM EVENTS
  ////////////////////////////////////////////////////////////

  async list(
    req: Request,
    res: Response,
  ): Promise<void> {
    const filters =
      ListSupportTeamEventsSchema.parse({
        teamId:
          String(
            req.query.teamId,
          ),

        ...(req.query.type !==
          undefined && {
          type:
            String(
              req.query.type,
            ),
        }),

        page:
          req.query.page !==
          undefined
            ? Number(
                req.query.page,
              )
            : undefined,

        limit:
          req.query.limit !==
          undefined
            ? Number(
                req.query.limit,
              )
            : undefined,
      });

    const events =
      await this.eventService.list(
        this.actor(req),
        filters,
      );

    res.json(
      events,
    );
  }
}