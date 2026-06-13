//////////////////////////////////////////////////////////
// FITMENT TYPES
//////////////////////////////////////////////////////////

export type FitmentType =
  | "UNIVERSAL"
  | "EXACT"
  | "RANGE"
  | "ENGINE_SPECIFIC"
  | "TRIM_SPECIFIC"
  | "OEM_MATCH"
  | "CROSS_REFERENCE"
  | "GENERATION_ONLY";

export type FitmentLevel =
  | "GLOBAL"
  | "MAKE"
  | "MODEL"
  | "GENERATION"
  | "ENGINE"
  | "TRIM"
  | "EXACT_MATCH";

//////////////////////////////////////////////////////////
// CONSTANTS (OPTIONAL)
//////////////////////////////////////////////////////////

export const FitmentTypes = {
  UNIVERSAL: "UNIVERSAL",
  EXACT: "EXACT",
  RANGE: "RANGE",
  ENGINE_SPECIFIC: "ENGINE_SPECIFIC",
  TRIM_SPECIFIC: "TRIM_SPECIFIC",
  OEM_MATCH: "OEM_MATCH",
  CROSS_REFERENCE: "CROSS_REFERENCE",
  GENERATION_ONLY: "GENERATION_ONLY",
} as const;

export const FitmentLevels = {
  GLOBAL: "GLOBAL",
  MAKE: "MAKE",
  MODEL: "MODEL",
  GENERATION: "GENERATION",
  ENGINE: "ENGINE",
  TRIM: "TRIM",
  EXACT_MATCH: "EXACT_MATCH",
} as const;