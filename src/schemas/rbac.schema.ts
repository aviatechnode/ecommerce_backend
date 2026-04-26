// schemas/role.schema.ts
import { z } from "zod";

/**
 * IMPORTANT:
 * - Use .nullish() instead of optional()
 * - Prisma expects null, NOT undefined
 */
export const createRoleSchema = z.object({
  name: z.string().min(2),
  description: z.string().nullish(),
  parentId: z.string().uuid().nullish(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullish(),
  parentId: z.string().uuid().nullish(),
});

/**
 * PARAM VALIDATION
 */
export const roleParamsSchema = z.object({
  roleId: z.string().uuid(),
});