import type { AuthUser } from "../../types/auth.types.js";
import type { AuthenticatedActor } from "../interfaces/actor.interface.js";

export function toChatActor(
  user: AuthUser,
): AuthenticatedActor {
  return {
    userId: user.id,
    roleId: user.roleId,
    roleName: user.roleName,
    permissions: user.permissions,
    isAuthenticated: true,
    isGuest: false,
    isSuperAdmin: user.isSuperAdmin,
  };
}