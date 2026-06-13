import { z } from "zod";

//////////////////////////////////////////////////////////
// ENUMS
//////////////////////////////////////////////////////////

export const fitmentTypeSchema = z.enum([
  "UNIVERSAL",
  "EXACT",
  "RANGE",
  "ENGINE_SPECIFIC",
  "TRIM_SPECIFIC",
  "OEM_MATCH",
  "CROSS_REFERENCE",
  "GENERATION_ONLY",
]);

export type FitmentType = z.infer<
  typeof fitmentTypeSchema
>;

export const fitmentLevelSchema = z.enum([
  "GLOBAL",
  "MAKE",
  "MODEL",
  "GENERATION",
  "ENGINE",
  "TRIM",
  "EXACT_MATCH",
]);

export type FitmentLevel = z.infer<
  typeof fitmentLevelSchema
>;