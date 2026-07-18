import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";

import { MessageDraftService } from "../../chat/services/message-draft.service.js";

import type {
  DeleteMessageDraft,
  GetMessageDraft,
  SaveMessageDraft,
} from "../../chat/schema_types/message-draft.type.js";

////////////////////////////////////////////////////////////
// PARAMS
////////////////////////////////////////////////////////////

type ConversationParams = {
  conversationId: string;
};

export class MessageDraftController {
  constructor(
    private readonly draftService:
      MessageDraftService,
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
  // SAVE
  ////////////////////////////////////////////////////////////

  async save(
    req: TypedRequest<
      ConversationParams,
      Omit<
        SaveMessageDraft,
        "conversationId"
      >
    >,
    res: Response,
  ): Promise<void> {
    const draft =
      await this.draftService.save(
        this.actor(req),
        {
          conversationId:
            req.params.conversationId,

          content:
            req.body.content,
        },
      );

    res.status(201).json(
      draft,
    );
  }

  ////////////////////////////////////////////////////////////
  // GET
  ////////////////////////////////////////////////////////////

  async get(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const draft =
      await this.draftService.get(
        this.actor(req),
        {
          conversationId:
            req.params.conversationId,
        },
      );

    if (!draft) {
      res.sendStatus(404);
      return;
    }

    res.json(
      draft,
    );
  }

  ////////////////////////////////////////////////////////////
  // RESTORE
  ////////////////////////////////////////////////////////////

  async restore(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    const draft =
      await this.draftService.restore(
        this.actor(req),
        req.params.conversationId,
      );

    if (!draft) {
      res.sendStatus(404);
      return;
    }

    res.json(
      draft,
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
    await this.draftService.delete(
      this.actor(req),
      {
        conversationId:
          req.params.conversationId,
      },
    );

    res.sendStatus(204);
  }
}