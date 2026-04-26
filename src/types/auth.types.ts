import type { PermissionString } from "../utils/rbac.js";

export type AuthUser = {
  id: string;
  roleId: string;
  roleName: string;
  permissions: Set<PermissionString>;
  isSuperAdmin: boolean;
};