import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";

import { MessageAttachmentService } from "../../chat/services/message-attachment.service.js";

////////////////////////////////////////////////////////////
// QUERY TYPES
////////////////////////////////////////////////////////////

type PaginationQuery = {
  page?: string;
  limit?: string;
};

type SearchAttachmentQuery = {
  messageId?: string;
  uploadedById?: string;
  mimeType?: string;
  extension?: string;
  filename?: string;
  page?: string;
  limit?: string;
};

////////////////////////////////////////////////////////////
// PARAM TYPES
////////////////////////////////////////////////////////////

type AttachmentParams = {
  attachmentId: string;
};

type MessageParams = {
  messageId: string;
};

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

export class MessageAttachmentController {
  constructor(
    private readonly attachmentService:
      MessageAttachmentService,
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
  // UPLOAD / CREATE
  ////////////////////////////////////////////////////////////

  async upload(
    req: Request,
    res: Response,
  ): Promise<void> {
    const attachment =
      await this.attachmentService.upload(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      attachment,
    );
  }

  ////////////////////////////////////////////////////////////
  // FIND BY ID
  ////////////////////////////////////////////////////////////

  async findById(
    req: Request<
      AttachmentParams
    >,
    res: Response,
  ): Promise<void> {
    const attachment =
      await this.attachmentService.findById(
        this.actor(req),
        req.params.attachmentId,
      );

    if (!attachment) {
      res.sendStatus(404);
      return;
    }

    res.json(
      attachment,
    );
  }

  ////////////////////////////////////////////////////////////
  // LIST BY MESSAGE
  ////////////////////////////////////////////////////////////

  async list(
    req: Request<
      MessageParams,
      unknown,
      unknown,
      PaginationQuery
    >,
    res: Response,
  ): Promise<void> {
    const page = Number(
      req.query.page ?? 1,
    );

    const limit = Number(
      req.query.limit ?? 20,
    );

    const attachments =
      await this.attachmentService.list(
        this.actor(req),
        {
          messageId:
            req.params.messageId,

          page,

          limit,
        },
      );

    res.json(
      attachments,
    );
  }

  ////////////////////////////////////////////////////////////
  // SEARCH
  ////////////////////////////////////////////////////////////

  async search(
    req: Request<
      Record<string, never>,
      unknown,
      unknown,
      SearchAttachmentQuery
    >,
    res: Response,
  ): Promise<void> {
    const filters = {
      messageId:
        req.query.messageId,

      uploadedById:
        req.query.uploadedById,

      mimeType:
        req.query.mimeType,

      extension:
        req.query.extension,

      filename:
        req.query.filename,

      page: Number(
        req.query.page ?? 1,
      ),

      limit: Number(
        req.query.limit ?? 20,
      ),
    };

    const attachments =
      await this.attachmentService.search(
        this.actor(req),
        filters,
      );

    res.json(
      attachments,
    );
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    req: Request<
      AttachmentParams
    >,
    res: Response,
  ): Promise<void> {
    await this.attachmentService.delete(
      this.actor(req),
      {
        attachmentId:
          req.params.attachmentId,
      },
    );

    res.sendStatus(204);
  }
}