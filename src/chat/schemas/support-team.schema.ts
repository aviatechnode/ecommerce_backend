import { z } from "zod";

////////////////////////////////////////////////////////////
// SUPPORT TEAM
////////////////////////////////////////////////////////////

export const SupportTeamSchema = z.object({
  id: z.string().uuid(),

  name: z
    .string()
    .trim()
    .min(2)
    .max(100),

  description: z.string().nullable(),

  slug: z.string().nullable(),

  isActive: z.boolean(),

  createdById: z.string().uuid().nullable(),

  createdAt: z.coerce.date(),

  updatedAt: z.coerce.date(),
});

export type SupportTeam = z.infer<
  typeof SupportTeamSchema
>;

////////////////////////////////////////////////////////////
// CREATE TEAM
////////////////////////////////////////////////////////////

export const CreateSupportTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100),

  description: z.string().optional(),

  slug: z.string().optional(),

  isActive: z.boolean().default(true),

  createdById: z.string().uuid().optional(),
});

export type CreateSupportTeam = z.infer<
  typeof CreateSupportTeamSchema
>;

////////////////////////////////////////////////////////////
// UPDATE TEAM
////////////////////////////////////////////////////////////

export const UpdateSupportTeamSchema = z.object({
  teamId: z.string().uuid(),

  name: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  description: z.string().optional(),

  slug: z.string().optional(),

  isActive: z.boolean().optional(),
});

export type UpdateSupportTeam = z.infer<
  typeof UpdateSupportTeamSchema
>;