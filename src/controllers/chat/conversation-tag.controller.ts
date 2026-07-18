import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";

import {
  ConversationTagService,
} from "../../chat/services/conversation-tag.service.js";

import type {
  AssignTag,
  CreateTag,
  RemoveTag,
  UpdateTag,
} from "../../chat/schema_types/conversation-tag.type.js";

////////////////////////////////////////////////////////////
// PARAMS
////////////////////////////////////////////////////////////

type TagParams = {
  tagId: string;
};

type ConversationParams = {
  conversationId: string;
};

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

export class ConversationTagController {
  constructor(
    private readonly tagService:
      ConversationTagService,
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
  // TAG CRUD
  ////////////////////////////////////////////////////////////

  async create(
    req: TypedRequest<
      {},
      CreateTag
    >,
    res: Response,
  ): Promise<void> {
    const tag =
      await this.tagService.create(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      tag,
    );
  }

  async update(
    req: TypedRequest<
      TagParams,
      Omit<UpdateTag, "tagId">
    >,
    res: Response,
  ): Promise<void> {
    const tag =
      await this.tagService.update(
        this.actor(req),
        {
          ...req.body,

          tagId:
            req.params.tagId,
        },
      );

    res.json(
      tag,
    );
  }

  async findById(
    req: TypedRequest<
      TagParams
    >,
    res: Response,
  ): Promise<void> {
    const tag =
      await this.tagService.findById(
        this.actor(req),
        req.params.tagId,
      );

    if (!tag) {
      res.sendStatus(404);
      return;
    }

    res.json(
      tag,
    );
  }

  async list(
    _req: Request,
    res: Response,
  ): Promise<void> {
    const tags =
      await this.tagService.list();

    res.json(
      tags,
    );
  }

  async delete(
    req: TypedRequest<
      TagParams
    >,
    res: Response,
  ): Promise<void> {
    await this.tagService.delete(
      this.actor(req),
      req.params.tagId,
    );

    res.sendStatus(204);
  }

  ////////////////////////////////////////////////////////////
  // CONVERSATION TAGS
  ////////////////////////////////////////////////////////////

  async assign(
    req: TypedRequest<
      ConversationParams,
      Omit<
        AssignTag,
        "conversationId"
      >
    >,
    res: Response,
  ): Promise<void> {
    await this.tagService.assign(
      this.actor(req),
      {
        ...req.body,

        conversationId:
          req.params.conversationId,
      },
    );

    res.sendStatus(204);
  }

  async remove(
    req: TypedRequest<
      ConversationParams,
      Omit<
        RemoveTag,
        "conversationId"
      >
    >,
    res: Response,
  ): Promise<void> {
    await this.tagService.remove(
      this.actor(req),
      {
        ...req.body,

        conversationId:
          req.params.conversationId,
      },
    );

    res.sendStatus(204);
  }

  async listByConversation(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const tags =
      await this.tagService.listByConversation(
        this.actor(req),
        req.params.conversationId,
      );

    res.json(
      tags,
    );
  }
}