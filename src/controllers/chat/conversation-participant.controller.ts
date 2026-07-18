import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";

import {
  ConversationParticipantService,
} from "../../chat/services/conversation-participant.service.js";

import type {
  AddParticipant,
  MarkConversationRead,
  MuteParticipant,
  UnreadCount,
} from "../../chat/schema_types/convsersation-participant.type.js";

type ConversationParams = {
  conversationId: string;
};

type ParticipantParams = {
  conversationId: string;
  userId: string;
};

type ParticipantIdParams = {
  participantId: string;
};

export class ConversationParticipantController {
  constructor(
    private readonly participantService:
      ConversationParticipantService,
  ) {}

  private actor(
    req: Request,
  ) {
    return toChatActor(
      req.user as AuthUser,
    );
  }

  ////////////////////////////////////////////////////////////
  // MEMBERSHIP
  ////////////////////////////////////////////////////////////

  async add(
    req: TypedRequest<
      ConversationParams,
      Omit<AddParticipant, "conversationId">
    >,
    res: Response,
  ): Promise<void> {
    const participant =
      await this.participantService.add(
        this.actor(req),
        {
          ...req.body,
          conversationId:
            req.params.conversationId,
        },
      );

    res.status(201).json(
      participant,
    );
  }

  async remove(
    req: TypedRequest<
      ParticipantParams
    >,
    res: Response,
  ): Promise<void> {
    await this.participantService.remove(
      this.actor(req),
      {
        conversationId:
          req.params.conversationId,

        userId:
          req.params.userId,
      },
    );

    res.sendStatus(204);
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    req: TypedRequest<
      ParticipantIdParams
    >,
    res: Response,
  ): Promise<void> {
    const participant =
      await this.participantService.findById(
        this.actor(req),
        req.params.participantId,
      );

    if (!participant) {
      res.sendStatus(404);
      return;
    }

    res.json(
      participant,
    );
  }

  async findByConversation(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const participants =
      await this.participantService.findByConversation(
        this.actor(req),
        req.params.conversationId,
      );

    res.json(
      participants,
    );
  }

  async list(
    req: Request,
    res: Response,
  ): Promise<void> {
    const {
      conversationId,
      page = "1",
      limit = "20",
    } = req.query;

    const participants =
      await this.participantService.list(
        this.actor(req),
        {
          conversationId:
            String(conversationId),

          page:
            Number(page),

          limit:
            Number(limit),
        },
      );

    res.json(
      participants,
    );
  }

  async findByUser(
    req: Request,
    res: Response,
  ): Promise<void> {
    const participants =
      await this.participantService.findByUser(
        this.actor(req),
      );

    res.json(
      participants,
    );
  }

  async findParticipant(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const participant =
      await this.participantService.findParticipant(
        this.actor(req),
        req.params.conversationId,
      );

    if (!participant) {
      res.sendStatus(404);
      return;
    }

    res.json(
      participant,
    );
  }

  ////////////////////////////////////////////////////////////
  // MUTE
  ////////////////////////////////////////////////////////////

  async mute(
    req: TypedRequest<
      ConversationParams,
      Omit<MuteParticipant, "conversationId">
    >,
    res: Response,
  ): Promise<void> {
    const participant =
      await this.participantService.mute(
        this.actor(req),
        {
          ...req.body,

          conversationId:
            req.params.conversationId,
        },
      );

    res.json(
      participant,
    );
  }

  ////////////////////////////////////////////////////////////
  // UNREAD
  ////////////////////////////////////////////////////////////

  async updateUnreadCount(
    req: TypedRequest<
      ConversationParams,
      Omit<UnreadCount, "conversationId">
    >,
    res: Response,
  ): Promise<void> {
    const participant =
      await this.participantService.updateUnreadCount(
        this.actor(req),
        {
          ...req.body,

          conversationId:
            req.params.conversationId,
        },
      );

    res.json(
      participant,
    );
  }

  async incrementUnreadCount(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const participant =
      await this.participantService.incrementUnreadCount(
        this.actor(req),
        req.params.conversationId,
      );

    res.json(
      participant,
    );
  }

  async resetUnreadCount(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const participant =
      await this.participantService.resetUnreadCount(
        this.actor(req),
        req.params.conversationId,
      );

    res.json(
      participant,
    );
  }

  ////////////////////////////////////////////////////////////
  // READ
  ////////////////////////////////////////////////////////////

  async markConversationRead(
    req: TypedRequest<
      ConversationParams,
      Omit<
        MarkConversationRead,
        "conversationId"
      >
    >,
    res: Response,
  ): Promise<void> {
    const participant =
      await this.participantService.markConversationRead(
        this.actor(req),
        {
          ...req.body,

          conversationId:
            req.params.conversationId,
        },
      );

    res.json(
      participant,
    );
  }
}