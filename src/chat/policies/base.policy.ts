import type { PermissionString } from "../../utils/rbac.js";
import {
  requireAuthenticated,
  type AuthenticatedActor,
  type ChatActor,
} from "../interfaces/actor.interface.js";
import { ForbiddenError } from "../_shared/forbidden.error.js";

export abstract class BasePolicy {
  ////////////////////////////////////////////////////////////
  // PERMISSIONS
  ////////////////////////////////////////////////////////////

  protected require(
    actor: ChatActor,
    permission: PermissionString,
  ): void {
    if (actor.isSuperAdmin) {
      return;
    }

    if (!actor.permissions.has(permission)) {
      throw new ForbiddenError(
        "You do not have permission to perform this action.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // AUTH
  ////////////////////////////////////////////////////////////

  protected requireAuthenticated(
    actor: ChatActor,
  ): asserts actor is AuthenticatedActor {
    requireAuthenticated(actor);
  }

  protected requireGuest(
    actor: ChatActor,
  ): void {
    if (!actor.isGuest) {
      throw new ForbiddenError(
        "Guest access required.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // USER
  ////////////////////////////////////////////////////////////

  protected requireUser(
    actor: ChatActor,
  ): string {
    requireAuthenticated(actor);
    return actor.userId;
  }

  ////////////////////////////////////////////////////////////
  // OWNERSHIP
  ////////////////////////////////////////////////////////////

  protected requireConversationOwner(
    actor: ChatActor,
    createdById: string | null,
  ): void {
    if (actor.isSuperAdmin) {
      return;
    }

    requireAuthenticated(actor);

    if (createdById !== actor.userId) {
      throw new ForbiddenError(
        "Only the owner may perform this action.",
      );
    }
  }

  protected requireConversationAssignee(
    actor: ChatActor,
    assignedUserId: string | null,
  ): void {
    if (actor.isSuperAdmin) {
      return;
    }

    requireAuthenticated(actor);

    if (assignedUserId !== actor.userId) {
      throw new ForbiddenError(
        "Conversation is assigned to another user.",
      );
    }
  }
}