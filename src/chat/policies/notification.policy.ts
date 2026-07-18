import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  CreateNotification,
  Notification,
} from "../schema_types/notification.type.js";

import { BasePolicy } from "./base.policy.js";

export class NotificationPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  create(
    actor: ChatActor,
    data: CreateNotification,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "notification:create");

    if (actor.userId !== data.userId) {
      throw new BusinessRuleError(
        "You may only create notifications for yourself.",
      );
    }
  }

  createMany(
    actor: ChatActor,
    data: CreateNotification[],
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "notification:create");

    for (const notification of data) {
      if (notification.userId !== actor.userId) {
        throw new BusinessRuleError(
          "You may only create notifications for yourself.",
        );
      }
    }
  }

  ////////////////////////////////////////////////////////////
  // VIEW
  ////////////////////////////////////////////////////////////

  view(
    actor: ChatActor,
    notification: Notification,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "notification:view");

    if (notification.userId !== actor.userId) {
      throw new BusinessRuleError(
        "You do not have access to this notification.",
      );
    }
  }

  list(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "notification:view");
  }

  ////////////////////////////////////////////////////////////
  // UPDATE
  ////////////////////////////////////////////////////////////

  update(
    actor: ChatActor,
    notification: Notification,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "notification:update");

    if (notification.userId !== actor.userId) {
      throw new BusinessRuleError(
        "You may only update your own notifications.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // READ STATUS
  ////////////////////////////////////////////////////////////

  markAsRead(
    actor: ChatActor,
    notification: Notification,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "notification:update");

    if (notification.userId !== actor.userId) {
      throw new BusinessRuleError(
        "You may only mark your own notifications as read.",
      );
    }
  }

  markAllAsRead(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "notification:update");
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  delete(
    actor: ChatActor,
    notification: Notification,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "notification:delete");

    if (notification.userId !== actor.userId) {
      throw new BusinessRuleError(
        "You may only delete your own notifications.",
      );
    }
  }

  deleteAll(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "notification:delete");
  }
}