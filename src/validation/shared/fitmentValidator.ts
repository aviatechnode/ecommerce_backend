import { ZodIssueCode, type RefinementCtx } from "zod";
import type { FitmentHierarchy } from "../../schemas/fitment-hierarchy.js";

export function validateFitmentHierarchy(
  level:
    | "GLOBAL"
    | "MAKE"
    | "MODEL"
    | "GENERATION"
    | "ENGINE"
    | "TRIM"
    | "EXACT_MATCH",
  hierarchy: FitmentHierarchy,
  ctx: RefinementCtx
) {
  const {
    makeId,
    modelId,
    generationId,
    engineId,
    trimId,
  } = hierarchy;

  switch (level) {
    case "GLOBAL":
      break;

    case "MAKE":
      if (!makeId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["makeId"],
          message: "makeId is required",
        });
      }
      break;

    case "MODEL":
      if (!makeId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["makeId"],
          message: "makeId is required",
        });
      }

      if (!modelId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["modelId"],
          message: "modelId is required",
        });
      }
      break;

    case "GENERATION":
      if (!makeId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["makeId"],
          message: "makeId is required",
        });
      }

      if (!modelId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["modelId"],
          message: "modelId is required",
        });
      }

      if (!generationId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["generationId"],
          message: "generationId is required",
        });
      }
      break;

    case "ENGINE":
      if (!makeId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["makeId"],
          message: "makeId is required",
        });
      }

      if (!modelId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["modelId"],
          message: "modelId is required",
        });
      }

      if (!generationId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["generationId"],
          message: "generationId is required",
        });
      }

      if (!engineId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["engineId"],
          message: "engineId is required",
        });
      }
      break;

    case "TRIM":
    case "EXACT_MATCH":
      if (!makeId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["makeId"],
          message: "makeId is required",
        });
      }

      if (!modelId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["modelId"],
          message: "modelId is required",
        });
      }

      if (!generationId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["generationId"],
          message: "generationId is required",
        });
      }

      if (!engineId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["engineId"],
          message: "engineId is required",
        });
      }

      if (!trimId) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["trimId"],
          message: "trimId is required",
        });
      }
      break;
  }
}