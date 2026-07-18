import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";

import {
  ConversationSLAService,
} from "../../chat/services/conversation-sla.service.js";

import type {
  UpdateSLA,
} from "../../chat/schema_types/conversation-sla.type.js";

type ConversationParams = {
  conversationId: string;
};

type SLAParams = {
  slaId: string;
};

export class ConversationSLAController {
  constructor(
    private readonly slaService:
      ConversationSLAService,
  ) {}

  private actor(
    req: Request,
  ) {
    return toChatActor(
      req.user as AuthUser,
    );
  }

  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  async create(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const sla =
      await this.slaService.create(
        this.actor(req),
        req.params.conversationId,
      );

    res.status(201).json(
      sla,
    );
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    req: TypedRequest<
      SLAParams
    >,
    res: Response,
  ): Promise<void> {
    const sla =
      await this.slaService.findById(
        this.actor(req),
        req.params.slaId,
      );

    if (!sla) {
      res.sendStatus(404);
      return;
    }

    res.json(
      sla,
    );
  }

  async findByConversation(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const sla =
      await this.slaService.findByConversation(
        this.actor(req),
        req.params.conversationId,
      );

    if (!sla) {
      res.sendStatus(404);
      return;
    }

    res.json(
      sla,
    );
  }

  ////////////////////////////////////////////////////////////
  // UPDATE
  ////////////////////////////////////////////////////////////

  async update(
    req: TypedRequest<
      ConversationParams,
      Omit<
        UpdateSLA,
        "conversationId"
      >
    >,
    res: Response,
  ): Promise<void> {
    const sla =
      await this.slaService.update(
        this.actor(req),
        {
          ...req.body,

          conversationId:
            req.params.conversationId,
        },
      );

    res.json(
      sla,
    );
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    await this.slaService.delete(
      this.actor(req),
      req.params.conversationId,
    );

    res.sendStatus(204);
  }

  ////////////////////////////////////////////////////////////
  // SLA EVENTS
  ////////////////////////////////////////////////////////////

  async markFirstResponseBreached(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const sla =
      await this.slaService
        .markFirstResponseBreached(
          this.actor(req),
          req.params.conversationId,
        );

    res.json(
      sla,
    );
  }

  async markResolutionBreached(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const sla =
      await this.slaService
        .markResolutionBreached(
          this.actor(req),
          req.params.conversationId,
        );

    res.json(
      sla,
    );
  }

  async markFirstResponded(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const sla =
      await this.slaService
        .markFirstResponded(
          this.actor(req),
          req.params.conversationId,
        );

    res.json(
      sla,
    );
  }

  async markResolved(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const sla =
      await this.slaService
        .markResolved(
          this.actor(req),
          req.params.conversationId,
        );

    res.json(
      sla,
    );
  }
}