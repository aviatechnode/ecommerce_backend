import { z } from "zod";
import { FitmentLevel } from "@prisma/client";

///////////////////////////////////////////////////////
// VEHICLE MAKE
///////////////////////////////////////////////////////

export const createVehicleMakeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

///////////////////////////////////////////////////////
// VEHICLE MODEL
///////////////////////////////////////////////////////

export const createVehicleModelSchema = z.object({
  makeId: z.string().uuid(),

  name: z.string().min(1),

  slug: z.string().min(1).optional(),

  isActive: z.boolean().optional(),
});

///////////////////////////////////////////////////////
// VEHICLE GENERATION
///////////////////////////////////////////////////////

export const createVehicleGenerationSchema = z.object({
  modelId: z.string().uuid(),

  name: z.string().min(1),

  slug: z.string().optional(),

  chassisCode: z.string().optional(),

  yearStart: z.number().int(),

  yearEnd: z.number().int().optional(),

  isActive: z.boolean().optional(),
});

///////////////////////////////////////////////////////
// VEHICLE ENGINE
///////////////////////////////////////////////////////

export const createVehicleEngineSchema = z.object({
  generationId: z.string().uuid(),

  engineCode: z.string().min(1),

  engineName: z.string().optional(),

  fuelType: z.string().optional(),

  aspiration: z.string().optional(),

  cylinders: z.number().int().optional(),

  horsepower: z.number().int().optional(),

  displacementCc: z.number().int().optional(),

  displacementLabel: z.string().optional(),

  drivetrain: z.string().optional(),

  transmissionType: z.string().optional(),

  isActive: z.boolean().optional(),
});

///////////////////////////////////////////////////////
// VEHICLE TRIM
///////////////////////////////////////////////////////

export const createVehicleTrimSchema = z.object({
  engineId: z.string().uuid(),

  name: z.string().min(1),

  bodyType: z.string().optional(),

  doors: z.number().int().optional(),

  isActive: z.boolean().optional(),
});

///////////////////////////////////////////////////////
// PRODUCT FITMENT
///////////////////////////////////////////////////////

export const createProductFitmentSchema = z.object({
  productId: z.string().uuid(),

  level: z.nativeEnum(FitmentLevel),

  makeId: z.string().uuid().optional(),

  modelId: z.string().uuid().optional(),

  generationId: z.string().uuid().optional(),

  engineId: z.string().uuid().optional(),

  trimId: z.string().uuid().optional(),

  yearStart: z.number().int().optional(),

  yearEnd: z.number().int().optional(),

  notes: z.string().optional(),

  position: z.string().optional(),

  quantityRequired: z.number().int().optional(),

  isUniversal: z.boolean().optional(),
});

///////////////////////////////////////////////////////
// BULK FITMENT ASSIGNMENT
///////////////////////////////////////////////////////

export const bulkAssignProductFitmentSchema = z.object({
  productId: z.string().uuid(),

  trimIds: z.array(z.string().uuid()).min(1),

  notes: z.string().optional(),

  position: z.string().optional(),

  quantityRequired: z.number().int().optional(),
});

///////////////////////////////////////////////////////
// FITMENT SEARCH
///////////////////////////////////////////////////////

export const fitmentSearchSchema = z.object({
  makeId: z.string().uuid().optional(),

  modelId: z.string().uuid().optional(),

  generationId: z.string().uuid().optional(),

  engineId: z.string().uuid().optional(),

  trimId: z.string().uuid().optional(),

  year: z.number().int().optional(),

  fuelType: z.string().optional(),

  transmissionType: z.string().optional(),

  drivetrain: z.string().optional(),
});