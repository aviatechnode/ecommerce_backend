import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";

import type { NotificationService } from "../../chat/services/notification.service.js";

import type {
  CreateNotification,
  UpdateNotification,
} from "../../chat/schema_types/notification.type.js";

////////////////////////////////////////////////////////////
// PARAMS
////////////////////////////////////////////////////////////

type NotificationParams = {
  notificationId: string;
};

////////////////////////////////////////////////////////////
// QUERY
////////////////////////////////////////////////////////////

type NotificationListQuery = {
  page?: string;
  limit?: string;
};

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

export class NotificationController {
  constructor(
    private readonly notificationService:
      NotificationService,
  ) {}

  private actor(req: Request) {
    return toChatActor(
      req.user as AuthUser,
    );
  }

  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  async create(
    req: TypedRequest<
      Record<string, never>,
      CreateNotification
    >,
    res: Response,
  ): Promise<void> {
    const notification =
      await this.notificationService.create(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      notification,
    );
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    req: TypedRequest<
      NotificationParams
    >,
    res: Response,
  ): Promise<void> {
    const notification =
      await this.notificationService.findById(
        this.actor(req),
        req.params.notificationId,
      );

    if (!notification) {
      res.sendStatus(404);
      return;
    }

    res.json(
      notification,
    );
  }

  ////////////////////////////////////////////////////////////
  // LIST
  ////////////////////////////////////////////////////////////

  async list(
    req: TypedRequest<
      Record<string, never>,
      Record<string, never>,
      NotificationListQuery
    >,
    res: Response,
  ): Promise<void> {
    const page = Number(
      req.query.page ?? 1,
    );

    const limit = Number(
      req.query.limit ?? 20,
    );

    const result =
      await this.notificationService.list(
        this.actor(req),
        page,
        limit,
      );

    res.json(
      result,
    );
  }

  ////////////////////////////////////////////////////////////
  // UPDATE
  ////////////////////////////////////////////////////////////

  async update(
    req: TypedRequest<
      NotificationParams,
      UpdateNotification
    >,
    res: Response,
  ): Promise<void> {
    const notification =
      await this.notificationService.update(
        this.actor(req),

        req.params.notificationId,

        req.body,
      );

    res.json(
      notification,
    );
  }

  ////////////////////////////////////////////////////////////
  // MARK AS READ
  ////////////////////////////////////////////////////////////

  async markAsRead(
    req: TypedRequest<
      NotificationParams
    >,
    res: Response,
  ): Promise<void> {
    const notification =
      await this.notificationService.markAsRead(
        this.actor(req),
        req.params.notificationId,
      );

    res.json(
      notification,
    );
  }

  ////////////////////////////////////////////////////////////
  // MARK ALL AS READ
  ////////////////////////////////////////////////////////////

  async markAllAsRead(
    req: Request,
    res: Response,
  ): Promise<void> {
    await this.notificationService.markAllAsRead(
      this.actor(req),
    );

    res.sendStatus(204);
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    req: TypedRequest<
      NotificationParams
    >,
    res: Response,
  ): Promise<void> {
    await this.notificationService.delete(
      this.actor(req),
      req.params.notificationId,
    );

    res.sendStatus(204);
  }

  ////////////////////////////////////////////////////////////
  // DELETE ALL
  ////////////////////////////////////////////////////////////

  async deleteAll(
    req: Request,
    res: Response,
  ): Promise<void> {
    await this.notificationService.deleteAll(
      this.actor(req),
    );

    res.sendStatus(204);
  }
}