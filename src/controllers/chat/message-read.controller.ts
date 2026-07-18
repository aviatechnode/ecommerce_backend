import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";

import { MessageReadService } from "../../chat/services/message-read.service.js";

type MessageParams = {
  messageId: string;
};

type ConversationParams = {
  conversationId: string;
};

type ListMessageReadsQuery = {
  page?: string;
  limit?: string;
};

export class MessageReadController {
  constructor(
    private readonly readService:
      MessageReadService,
  ) {}

  private actor(
    req: Request,
  ) {
    return toChatActor(
      req.user as AuthUser,
    );
  }

  ////////////////////////////////////////////////////////////
  // MARK MESSAGE READ
  ////////////////////////////////////////////////////////////

  async markRead(
    req: TypedRequest<
      MessageParams
    >,
    res: Response,
  ): Promise<void> {
    const read =
      await this.readService.markRead(
        this.actor(req),
        {
          messageId:
            req.params.messageId,

          userId:
            (req.user as AuthUser).id,
        },
      );

    res.status(201).json(
      read,
    );
  }

  ////////////////////////////////////////////////////////////
  // FIND CURRENT USER READ RECEIPT
  ////////////////////////////////////////////////////////////

  async find(
    req: TypedRequest<
      MessageParams
    >,
    res: Response,
  ): Promise<void> {
    const read =
      await this.readService.find(
        this.actor(req),
        req.params.messageId,
      );

    if (!read) {
      res.sendStatus(404);
      return;
    }

    res.json(
      read,
    );
  }

  ////////////////////////////////////////////////////////////
  // IS READ
  ////////////////////////////////////////////////////////////

  async isRead(
    req: TypedRequest<
      MessageParams
    >,
    res: Response,
  ): Promise<void> {
    const isRead =
      await this.readService.isRead(
        this.actor(req),
        req.params.messageId,
      );

    res.json({
      isRead,
    });
  }

  ////////////////////////////////////////////////////////////
  // LIST READ RECEIPTS
  ////////////////////////////////////////////////////////////

  async list(
    req: TypedRequest<
      MessageParams,
      unknown,
      ListMessageReadsQuery
    >,
    res: Response,
  ): Promise<void> {
    const page = Number(
      req.query.page ?? 1,
    );

    const limit = Number(
      req.query.limit ?? 50,
    );

    const reads =
      await this.readService.list(
        this.actor(req),
        {
          messageId:
            req.params.messageId,

          page,

          limit,
        },
      );

    res.json(
      reads,
    );
  }

  ////////////////////////////////////////////////////////////
  // READ COUNT
  ////////////////////////////////////////////////////////////

  async count(
    req: TypedRequest<
      MessageParams
    >,
    res: Response,
  ): Promise<void> {
    const count =
      await this.readService.getReadCount(
        this.actor(req),
        req.params.messageId,
      );

    res.json({
      count,
    });
  }

  ////////////////////////////////////////////////////////////
  // MARK CONVERSATION READ
  ////////////////////////////////////////////////////////////

  async markConversationRead(
    req: TypedRequest<
      ConversationParams
    >,
    res: Response,
  ): Promise<void> {
    await this.readService.markConversationRead(
      this.actor(req),
      req.params.conversationId,
    );

    res.sendStatus(204);
  }

  ////////////////////////////////////////////////////////////
  // MARK MULTIPLE MESSAGES READ
  ////////////////////////////////////////////////////////////

  async markMessagesRead(
    req: Request,
    res: Response,
  ): Promise<void> {
    const messageIds =
      req.body.messageIds as string[];

    await this.readService.markMessagesRead(
      this.actor(req),
      messageIds,
    );

    res.sendStatus(204);
  }
}