import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";

import type { MessageService } from "../../chat/services/message.service.js";

import type {
  DeleteMessage,
  EditMessage,
  ListMessages,
  ReplyMessage,
  SendMessage,
} from "../../chat/schema_types/message.type.js";

////////////////////////////////////////////////////////////
// PARAMS
////////////////////////////////////////////////////////////

type MessageParams = {
  messageId: string;
};

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

export class MessageController {
  constructor(
    private readonly messageService:
      MessageService,
  ) {}

  private actor(req: Request) {
    return toChatActor(
      req.user as AuthUser,
    );
  }

  ////////////////////////////////////////////////////////////
  // SEND
  ////////////////////////////////////////////////////////////

  async send(
    req: TypedRequest<
      Record<string, never>,
      SendMessage
    >,
    res: Response,
  ): Promise<void> {
    const message =
      await this.messageService.send(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      message,
    );
  }

  ////////////////////////////////////////////////////////////
  // REPLY
  ////////////////////////////////////////////////////////////

  async reply(
    req: TypedRequest<
      Record<string, never>,
      ReplyMessage
    >,
    res: Response,
  ): Promise<void> {
    const message =
      await this.messageService.reply(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      message,
    );
  }

  ////////////////////////////////////////////////////////////
  // EDIT
  ////////////////////////////////////////////////////////////

  async edit(
    req: TypedRequest<
      MessageParams,
      Omit<
        EditMessage,
        "messageId"
      >
    >,
    res: Response,
  ): Promise<void> {
    const message =
      await this.messageService.edit(
        this.actor(req),
        {
          ...req.body,

          messageId:
            req.params.messageId,
        },
      );

    res.json(
      message,
    );
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    req: TypedRequest<
      MessageParams,
      DeleteMessage
    >,
    res: Response,
  ): Promise<void> {
    await this.messageService.delete(
      this.actor(req),
      {
        messageId:
          req.params.messageId,

        hardDelete:
          req.body.hardDelete,
      },
    );

    res.sendStatus(204);
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    req: TypedRequest<
      MessageParams
    >,
    res: Response,
  ): Promise<void> {
    const message =
      await this.messageService.findById(
        this.actor(req),
        req.params.messageId,
      );

    if (!message) {
      res.sendStatus(404);
      return;
    }

    res.json(
      message,
    );
  }

  ////////////////////////////////////////////////////////////
  // LIST
  ////////////////////////////////////////////////////////////

  async list(
    req: TypedRequest<
      Record<string, never>,
      ListMessages
    >,
    res: Response,
  ): Promise<void> {
    const result =
      await this.messageService.list(
        this.actor(req),
        req.body,
      );

    res.json(
      result,
    );
  }

  ////////////////////////////////////////////////////////////
  // REPLIES
  ////////////////////////////////////////////////////////////

  async findReplies(
    req: TypedRequest<
      MessageParams
    >,
    res: Response,
  ): Promise<void> {
    const replies =
      await this.messageService.findReplies(
        this.actor(req),
        req.params.messageId,
      );

    res.json(
      replies,
    );
  }

  ////////////////////////////////////////////////////////////
  // READ
  ////////////////////////////////////////////////////////////

  async markRead(
    req: TypedRequest<
      MessageParams
    >,
    res: Response,
  ): Promise<void> {
    const message =
      await this.messageService.markRead(
        this.actor(req),
        req.params.messageId,
      );

    res.json(
      message,
    );
  }

  ////////////////////////////////////////////////////////////
  // DELIVERY
  ////////////////////////////////////////////////////////////

  async markDelivered(
    req: TypedRequest<
      MessageParams
    >,
    res: Response,
  ): Promise<void> {
    const message =
      await this.messageService.markDelivered(
        this.actor(req),
        req.params.messageId,
      );

    res.json(
      message,
    );
  }
}