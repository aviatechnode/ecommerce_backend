import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  CreateNotification,
  Notification,
  UpdateNotification,
} from "../schema_types/notification.type.js";

export interface INotificationGateway {
  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: CreateNotification,
  ): Promise<Notification>;

  createMany(
    actor: ChatActor,
    data: CreateNotification[],
  ): Promise<Notification[]>;

  ////////////////////////////////////////////////////////////
  // UPDATE
  ////////////////////////////////////////////////////////////

  update(
    actor: ChatActor,
    id: string,
    data: UpdateNotification,
  ): Promise<Notification>;

  markAsRead(
    actor: ChatActor,
    id: string,
  ): Promise<Notification>;

  markAllAsRead(
    actor: ChatActor,
  ): Promise<void>;

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<Notification | null>;

  findMany(
    actor: ChatActor,
    page: number,
    limit: number,
  ): Promise<Notification[]>;

  count(
    actor: ChatActor,
  ): Promise<number>;

  countUnread(
    actor: ChatActor,
  ): Promise<number>;

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  delete(
    actor: ChatActor,
    id: string,
  ): Promise<void>;

  deleteAll(
    actor: ChatActor,
  ): Promise<void>;
}