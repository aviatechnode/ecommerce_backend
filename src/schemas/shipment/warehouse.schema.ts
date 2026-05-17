import { z } from "zod";

/* =========================================================
COMMON
========================================================= */

export const uuidSchema = z.string().uuid();

/* =========================================================
WAREHOUSE
========================================================= */

export const warehouseIdParamSchema =
  z.object({
    id: uuidSchema,
  });

export const createWarehouseSchema =
  z.object({
    name: z
      .string()
      .min(2)
      .max(120),

    city: z
      .string()
      .min(2)
      .max(120),

    stateId: uuidSchema,

    isActive: z
      .boolean()
      .optional()
      .default(true),
  });

export const updateWarehouseSchema =
  createWarehouseSchema
    .partial();

/* =========================================================
WAREHOUSE LGA
========================================================= */

export const createWarehouseLGASchema =
  z.object({
    warehouseId: uuidSchema,
    lgaId: uuidSchema,
  });

export const warehouseLGAUniqueSchema =
  createWarehouseLGASchema;

/* =========================================================
WAREHOUSE ROUTE
========================================================= */

export const warehouseRouteIdParamSchema =
  z.object({
    id: uuidSchema,
  });

export const createWarehouseRouteSchema =
  z.object({
    warehouseId: uuidSchema,

    stateId: uuidSchema,

    lgaId: uuidSchema.optional(),

    priority: z
      .number()
      .int()
      .min(0)
      .default(0),
  });

export const updateWarehouseRouteSchema =
  createWarehouseRouteSchema
    .omit({
      warehouseId: true,
    })
    .partial();

/* =========================================================
TYPES
========================================================= */

export type CreateWarehouseInput =
  z.infer<
    typeof createWarehouseSchema
  >;

export type UpdateWarehouseInput =
  z.infer<
    typeof updateWarehouseSchema
  >;

export type CreateWarehouseLGAInput =
  z.infer<
    typeof createWarehouseLGASchema
  >;

export type WarehouseLGAUniqueInput =
  z.infer<
    typeof warehouseLGAUniqueSchema
  >;

export type CreateWarehouseRouteInput =
  z.infer<
    typeof createWarehouseRouteSchema
  >;

export type UpdateWarehouseRouteInput =
  z.infer<
    typeof updateWarehouseRouteSchema
  >;