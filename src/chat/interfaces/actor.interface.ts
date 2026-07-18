import type { PermissionString } from "../../utils/rbac.js";

import {
  BusinessRuleError,
} from "../_shared/business-rule-error.js";

////////////////////////////////////////////////////////////
// AUTHENTICATED
////////////////////////////////////////////////////////////

export interface AuthenticatedActor {
  userId: string;

  roleId: string;

  roleName: string;

  permissions:
    ReadonlySet<PermissionString>;

  isAuthenticated: true;

  isGuest: false;

  isSystem: false;

  isSuperAdmin: boolean;
}

////////////////////////////////////////////////////////////
// GUEST
////////////////////////////////////////////////////////////

export interface GuestActor {
  guestSessionId: string;

  permissions:
    ReadonlySet<PermissionString>;

  isAuthenticated: false;

  isGuest: true;

  isSystem: false;

  isSuperAdmin: false;
}

////////////////////////////////////////////////////////////
// SYSTEM
////////////////////////////////////////////////////////////

export interface SystemActor {
  permissions:
    ReadonlySet<PermissionString>;

  isAuthenticated: false;

  isGuest: false;

  isSystem: true;

  isSuperAdmin: true;
}

////////////////////////////////////////////////////////////
// UNION
////////////////////////////////////////////////////////////

export type ChatActor =
  | AuthenticatedActor
  | GuestActor
  | SystemActor;

////////////////////////////////////////////////////////////
// TYPE GUARDS
////////////////////////////////////////////////////////////

export function isAuthenticated(
  actor: ChatActor,
): actor is AuthenticatedActor {
  return actor.isAuthenticated;
}

export function isGuest(
  actor: ChatActor,
): actor is GuestActor {
  return actor.isGuest;
}

export function isSystem(
  actor: ChatActor,
): actor is SystemActor {
  return actor.isSystem;
}

////////////////////////////////////////////////////////////
// ASSERTION
////////////////////////////////////////////////////////////

export function requireAuthenticated(
  actor: ChatActor,
): asserts actor is AuthenticatedActor {
  if (!actor.isAuthenticated) {
    throw new BusinessRuleError(
      "Authentication required.",
    );
  }
}