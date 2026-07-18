import type { ChatActor } from "./actor.interface.js";

import type {
  CreateNotification,
  Notification,
  UpdateNotification,
} from "../schema_types/notification.type.js";

import type { Message } from "../schema_types/message.type.js";

export interface INotificationService {
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

  list(
    actor: ChatActor,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Notification[];
    total: number;
    unread: number;
  }>;

  ////////////////////////////////////////////////////////////
  // BUSINESS
  ////////////////////////////////////////////////////////////

  notifyChatMessage(
    actor: ChatActor,
    message: Message,
  ): Promise<void>;

  notifyAssigned(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void>;

  notifyUnassigned(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void>;

  notifyStatusChanged(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void>;

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