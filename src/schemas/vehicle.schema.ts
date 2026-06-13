import { z } from "zod";

// ENUMS
export const fuelTypeSchema = z.enum([
  "PETROL",
  "DIESEL",
  "HYBRID",
  "PLUG_IN_HYBRID",
  "ELECTRIC",
  "LPG",
  "CNG",
]);

export const aspirationTypeSchema = z.enum([
  "NA",
  "TURBO",
  "TWIN_TURBO",
  "SUPERCHARGED",
]);

export const transmissionTypeSchema = z.enum([
  "MANUAL",
  "AUTOMATIC",
  "CVT",
  "DCT",
]);

export const driveTypeSchema = z.enum([
  "FWD",
  "RWD",
  "AWD",
  "FOUR_WD",
]);

export const bodyTypeSchema = z.enum([
  "SEDAN",
  "HATCHBACK",
  "COUPE",
  "CONVERTIBLE",
  "SUV",
  "CROSSOVER",
  "PICKUP",
  "WAGON",
  "VAN",
  "MINIVAN",
  "MPV",
]);

//////////////////////////////////////////////////////////
// VEHICLE MAKE
//////////////////////////////////////////////////////////

export const createVehicleMakeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(120),
  isActive: z.boolean().optional(),
});

export const updateVehicleMakeSchema =
  createVehicleMakeSchema.partial();

//////////////////////////////////////////////////////////
// VEHICLE MODEL
//////////////////////////////////////////////////////////

export const createVehicleModelSchema = z.object({
  makeId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(120),
  isActive: z.boolean().optional(),
});

export const updateVehicleModelSchema =
  createVehicleModelSchema.partial();

//////////////////////////////////////////////////////////
// VEHICLE GENERATION
//////////////////////////////////////////////////////////

const vehicleGenerationBaseSchema = z.object({
  modelId: z.string().uuid(),

  name: z.string().trim().min(1).max(100),

  slug: z.string().trim().max(120).optional(),

  chassisCode: z
    .string()
    .trim()
    .max(50)
    .optional(),

  yearStart: z.number().int().min(1900),

  yearEnd: z.number().int().optional(),

  isActive: z.boolean().optional(),
});

export const createVehicleGenerationSchema =
  vehicleGenerationBaseSchema.superRefine(
    (data, ctx) => {
      if (
        data.yearEnd !== undefined &&
        data.yearEnd < data.yearStart
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["yearEnd"],
          message:
            "yearEnd must be greater than or equal to yearStart",
        });
      }
    }
  );

export const updateVehicleGenerationSchema =
  vehicleGenerationBaseSchema
    .partial()
    .superRefine((data, ctx) => {
      if (
        data.yearStart !== undefined &&
        data.yearEnd !== undefined &&
        data.yearEnd < data.yearStart
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["yearEnd"],
          message:
            "yearEnd must be greater than or equal to yearStart",
        });
      }
    });

// VEHICLE ENGINE
export const createVehicleEngineSchema = z.object({
  generationId: z.string().uuid(),
  engineCode: z
    .string()
    .trim()
    .min(1)
    .max(100),

  engineName: z
    .string()
    .trim()
    .max(255)
    .optional(),

  fuelType: fuelTypeSchema.optional(),

  aspiration: aspirationTypeSchema.optional(),

  cylinders: z
    .number()
    .int()
    .positive()
    .max(24)
    .optional(),

  horsepower: z
    .number()
    .int()
    .positive()
    .max(5000)
    .optional(),

  displacementCc: z
    .number()
    .int()
    .positive()
    .max(20000)
    .optional(),

  displacementLabel: z
    .string()
    .trim()
    .max(50)
    .optional(),

  drivetrain: driveTypeSchema.optional(),

  transmissionType:
    transmissionTypeSchema.optional(),

  isActive: z.boolean().optional(),
});

export const updateVehicleEngineSchema =
  createVehicleEngineSchema.partial();

//////////////////////////////////////////////////////////
// VEHICLE TRIM
//////////////////////////////////////////////////////////

export const createVehicleTrimSchema = z.object({
  engineId: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1)
    .max(150),

  bodyType: bodyTypeSchema.optional(),

  doors: z
    .number()
    .int()
    .min(2)
    .max(6)
    .optional(),

  isActive: z.boolean().optional(),
});

export const updateVehicleTrimSchema =
  createVehicleTrimSchema.partial();

//////////////////////////////////////////////////////////
// PARAM SCHEMAS
//////////////////////////////////////////////////////////

export const vehicleMakeIdParamSchema = z.object({
  makeId: z.string().uuid(),
});

export const vehicleModelIdParamSchema = z.object({
  modelId: z.string().uuid(),
});

export const vehicleGenerationIdParamSchema = z.object({
  generationId: z.string().uuid(),
});

export const vehicleEngineIdParamSchema = z.object({
  engineId: z.string().uuid(),
});

export const vehicleTrimIdParamSchema = z.object({
  trimId: z.string().uuid(),
});

//////////////////////////////////////////////////////////
// QUERY SCHEMAS
//////////////////////////////////////////////////////////
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const getVehicleMakesQuerySchema = paginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});

export const getVehicleModelsQuerySchema = paginationSchema.extend({
  makeId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});

export const getVehicleGenerationsQuerySchema = paginationSchema.extend({
  modelId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  year: z.coerce.number().int().optional(),
  chassisCode: z.string().trim().optional(),
});

export const getVehicleEnginesQuerySchema = paginationSchema.extend({
  generationId: z.string().uuid().optional(),
  fuelType: fuelTypeSchema.optional(),
  drivetrain: driveTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
});

export const getVehicleTrimsQuerySchema = paginationSchema.extend({
  engineId: z.string().uuid().optional(),
  bodyType: bodyTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
});