import { z } from "zod";

/* =========================================================
BASE UUID FIELD
========================================================= */

const uuid = (label: string) =>
  z.string().uuid(`${label} must be a valid UUID`);

/* =========================================================
RELATION FACTORY (DRY CORE)
========================================================= */

export function createZoneRelationSchema<
  T extends {
    zoneField: string;
    targetField: string;
  }
>(config: T) {
  return {
    create: z.object({
      zoneId: uuid("Zone ID"),
      [config.targetField]: uuid(`${config.targetField}`),
    }),

    update: z
      .object({
        zoneId: uuid("Zone ID").optional(),
        [config.targetField]: uuid(`${config.targetField}`).optional(),
      })
      .refine((d) => d.zoneId || d[config.targetField], {
        message: "At least one field must be provided",
      }),

    unique: z.object({
      zoneId: uuid("Zone ID"),
      [config.targetField]: uuid(`${config.targetField}`),
    }),
  };
}