import type {
  Request,
  Response,
} from "express";

import {
  toChatActor,
} from "../../chat/auth/chat-actor.js";

import type {
  AuthUser,
} from "../../types/auth.types.js";

import type {
  TypedRequest,
} from "../../types/express.js";

import type { EventOutboxService } from "../../chat/services/outbox-event.service.js";

import type {
  CreateOutboxEvent,
} from "../../chat/schema_types/outbox-event.type.js";

////////////////////////////////////////////////////////////
// PARAMS
////////////////////////////////////////////////////////////

type EventOutboxParams = {
  eventId: string;
};

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

export class EventOutboxController {
  constructor(
    private readonly eventOutboxService:
      EventOutboxService,
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
  // PUBLISH
  ////////////////////////////////////////////////////////////

  async publish(
    req: TypedRequest<
      Record<string, never>,
      CreateOutboxEvent
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventOutboxService.publish(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    req: TypedRequest<
      EventOutboxParams
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventOutboxService.findById(
        this.actor(req),
        req.params.eventId,
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
  // PROCESS PENDING
  ////////////////////////////////////////////////////////////

  async processPending(
    req: Request,
    res: Response,
  ): Promise<void> {
    await this.eventOutboxService.processPending(
      this.actor(req),
    );

    res.sendStatus(204);
  }

  ////////////////////////////////////////////////////////////
  // MARK PROCESSED
  ////////////////////////////////////////////////////////////

  async markProcessed(
    req: TypedRequest<
      EventOutboxParams
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventOutboxService.markProcessed(
        this.actor(req),
        req.params.eventId,
      );

    res.json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // MARK FAILED
  ////////////////////////////////////////////////////////////

  async markFailed(
    req: TypedRequest<
      EventOutboxParams,
      {
        error: string;
      }
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventOutboxService.markFailed(
        this.actor(req),
        req.params.eventId,
        req.body.error,
      );

    res.json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // RETRY
  ////////////////////////////////////////////////////////////

  async retry(
    req: TypedRequest<
      EventOutboxParams
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventOutboxService.retry(
        this.actor(req),
        req.params.eventId,
      );

    res.json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // LOCK
  ////////////////////////////////////////////////////////////

  async lock(
    req: TypedRequest<
      EventOutboxParams,
      {
        workerId: string;
      }
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventOutboxService.lock(
        this.actor(req),
        req.params.eventId,
        req.body.workerId,
      );

    res.json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // UNLOCK
  ////////////////////////////////////////////////////////////

  async unlock(
    req: TypedRequest<
      EventOutboxParams
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventOutboxService.unlock(
        this.actor(req),
        req.params.eventId,
      );

    res.json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // DELETE EXPIRED
  ////////////////////////////////////////////////////////////

  async deleteExpired(
    req: Request,
    res: Response,
  ): Promise<void> {
    const count =
      await this.eventOutboxService.deleteExpired();

    res.json({
      deleted: count,
    });
  }
}