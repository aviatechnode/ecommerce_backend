import { z } from "zod";
import { Prisma } from "@prisma/client";

/* =========================================================
CREATE AUDIT LOG
========================================================= */

export const createAuditLogSchema = z.object({
  userId: z.string().uuid(),

  action: z.string().min(2).max(100),
  entity: z.string().min(2).max(100),

  // ✅ convert undefined → null
  entityId: z.string().uuid().optional().transform(v => v ?? null),

  ipAddress: z
    .string()
    .ip({ version: "v4" })
    .or(z.string().ip({ version: "v6" }))
    .optional()
    .transform(v => v ?? null),

  userAgent: z.string().max(500).optional().transform(v => v ?? null),

  // ✅ return Prisma-compatible JSON
  metadata: z
    .union([
      z.record(z.unknown()),
      z.array(z.unknown()),
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
    ])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined; // omit field
      if (v === null) return Prisma.JsonNull; // JSON null
      return v; // valid JSON
    }),
});

/* =========================================================
QUERY AUDIT LOGS
========================================================= */

export const auditLogQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  entity: z.string().min(2).optional(),
  entityId: z.string().uuid().optional(),

  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((v) => v > 0)
    .optional(),

  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((v) => v > 0 && v <= 100)
    .optional(),
});