import { z } from "zod";

export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const attachPermissionSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
});

export const attachGroupSchema = z.object({
  roleId: z.string().uuid(),
  groupId: z.string().uuid(),
});