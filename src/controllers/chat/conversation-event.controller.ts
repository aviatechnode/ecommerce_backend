import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";

import {
  ConversationEventService,
} from "../../chat/services/conversation-event.service.js";

import type {
  CreateConversationEvent,
  RecordAssignmentEvent,
  RecordConversationClosedEvent,
  RecordConversationResolvedEvent,
  RecordMessageSentEvent,
  RecordPriorityChangeEvent,
  RecordStatusChangeEvent,
  RecordTagAddedEvent,
  RecordTagRemovedEvent,
} from "../../chat/schema_types/conversation-event.type.js";

import {
  ListConversationEventsSchema,
} from "../../chat/schemas/events/conversation-event.schema.js";

type EventParams = {
  eventId: string;
};

type ConversationParams = {
  conversationId: string;
};

export class ConversationEventController {
  constructor(
    private readonly eventService:
      ConversationEventService,
  ) {}

  private actor(
    req: Request,
  ) {
    return toChatActor(
      req.user as AuthUser,
    );
  }

  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  async create(
    req: TypedRequest<
      {},
      CreateConversationEvent
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.create(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      event,
    );
  }

  async findById(
    req: TypedRequest<
      EventParams
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.findById(
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

  async list(
    req: Request,
    res: Response,
  ): Promise<void> {
    const filters =
      ListConversationEventsSchema.parse({
        conversationId:
          String(
            req.query.conversationId,
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

  ////////////////////////////////////////////////////////////
  // GENERIC RECORD
  ////////////////////////////////////////////////////////////

  async record(
    req: TypedRequest<
      {},
      CreateConversationEvent
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
  // ASSIGNMENT
  ////////////////////////////////////////////////////////////

  async recordAssignment(
    req: TypedRequest<
      {},
      RecordAssignmentEvent
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.recordAssignment(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // STATUS
  ////////////////////////////////////////////////////////////

  async recordStatusChange(
    req: TypedRequest<
      {},
      RecordStatusChangeEvent
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.recordStatusChange(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // PRIORITY
  ////////////////////////////////////////////////////////////

  async recordPriorityChange(
    req: TypedRequest<
      {},
      RecordPriorityChangeEvent
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.recordPriorityChange(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // TAG ADDED
  ////////////////////////////////////////////////////////////

  async recordTagAdded(
    req: TypedRequest<
      {},
      RecordTagAddedEvent
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.recordTagAdded(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // TAG REMOVED
  ////////////////////////////////////////////////////////////

  async recordTagRemoved(
    req: TypedRequest<
      {},
      RecordTagRemovedEvent
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.recordTagRemoved(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // MESSAGE SENT
  ////////////////////////////////////////////////////////////

  async recordMessageSent(
    req: TypedRequest<
      {},
      RecordMessageSentEvent
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.recordMessageSent(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // CLOSED
  ////////////////////////////////////////////////////////////

  async recordConversationClosed(
    req: TypedRequest<
      {},
      RecordConversationClosedEvent
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.recordConversationClosed(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      event,
    );
  }

  ////////////////////////////////////////////////////////////
  // RESOLVED
  ////////////////////////////////////////////////////////////

  async recordConversationResolved(
    req: TypedRequest<
      {},
      RecordConversationResolvedEvent
    >,
    res: Response,
  ): Promise<void> {
    const event =
      await this.eventService.recordConversationResolved(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      event,
    );
  }
}