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

export const fitmentLevelSchema = z.enum([
  "GLOBAL",
  "MAKE",
  "MODEL",
  "GENERATION",
  "ENGINE",
  "TRIM",
  "EXACT_MATCH",
]);

//////////////////////////////////////////////////////////
// COMMON
//////////////////////////////////////////////////////////

const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

//////////////////////////////////////////////////////////
// FITMENT SERVICE CONFIG
//////////////////////////////////////////////////////////

export const createFitmentServiceConfigSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
  allowUniversalFallback: z.boolean().optional(),
  allowCrossGenerationMatch: z.boolean().optional(),
  allowEngineFallback: z.boolean().optional(),
  weightMake: z.number().int().min(0).optional(),
  weightModel: z.number().int().min(0).optional(),
  weightGeneration: z.number().int().min(0).optional(),
  weightEngine: z.number().int().min(0).optional(),
  weightTrim: z.number().int().min(0).optional(),
  weightYear: z.number().int().min(0).optional(),
  enableFitmentIndexing: z.boolean().optional(),
  enableTextSearchFallback: z.boolean().optional(),
});

export const updateFitmentServiceConfigSchema = createFitmentServiceConfigSchema.partial();

//////////////////////////////////////////////////////////
// FITMENT TYPE RULE
//////////////////////////////////////////////////////////

export const createFitmentTypeRuleSchema = z.object({
  type: fitmentTypeSchema,
  level: fitmentLevelSchema,
  requiresMake: z.boolean().optional(),
  requiresModel: z.boolean().optional(),
  requiresGeneration: z.boolean().optional(),
  requiresEngine: z.boolean().optional(),
  requiresTrim: z.boolean().optional(),
  requiresYear: z.boolean().optional(),
  allowYearRange: z.boolean().optional(),
  strictMatching: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
});

export const updateFitmentTypeRuleSchema = createFitmentTypeRuleSchema.partial();

//////////////////////////////////////////////////////////
// OEM REFERENCE
//////////////////////////////////////////////////////////

export const createOEMReferenceSchema = z.object({
  manufacturer: z.string().trim().min(1).max(150),
  partNumber: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional(),
});

export const updateOEMReferenceSchema = createOEMReferenceSchema.partial();

//////////////////////////////////////////////////////////
// CROSS REFERENCE
//////////////////////////////////////////////////////////

export const createCrossReferenceSchema = z.object({
  brand: z.string().trim().min(1).max(150),
  partNumber: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional(),
});

export const updateCrossReferenceSchema = createCrossReferenceSchema.partial();

//////////////////////////////////////////////////////////
// PRODUCT FITMENT
//////////////////////////////////////////////////////////

// Base schema without superRefine
const productFitmentBaseObjectSchema = z.object({
  productId: uuidSchema,
  level: fitmentLevelSchema,
  type: fitmentTypeSchema.default("EXACT"),
  makeId: uuidSchema.optional(),
  modelId: uuidSchema.optional(),
  generationId: uuidSchema.optional(),
  engineId: uuidSchema.optional(),
  trimId: uuidSchema.optional(),
  yearStart: z.number().int().min(1900).max(2100).optional(),
  yearEnd: z.number().int().min(1900).max(2100).optional(),
  notes: z.string().trim().max(2000).optional(),
  position: z.string().trim().max(100).optional(),
  quantityRequired: z.number().int().positive().optional(),
  isUniversal: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  confidenceScore: z.number().int().min(0).max(100).optional(),
});

// Apply superRefine to the base schema
export const productFitmentBaseSchema = productFitmentBaseObjectSchema.superRefine(
  (data, ctx) => {
    if (
      data.yearStart !== undefined &&
      data.yearEnd !== undefined &&
      data.yearEnd < data.yearStart
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["yearEnd"],
        message: "yearEnd must be greater than or equal to yearStart",
      });
    }

    switch (data.level) {
      case "MAKE":
        if (!data.makeId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["makeId"],
            message: "makeId is required for MAKE fitment",
          });
        }
        break;

      case "MODEL":
        if (!data.makeId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["makeId"],
            message: "makeId is required",
          });
        }
        if (!data.modelId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["modelId"],
            message: "modelId is required",
          });
        }
        break;

      case "GENERATION":
        if (!data.generationId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["generationId"],
            message: "generationId is required",
          });
        }
        break;

      case "ENGINE":
        if (!data.engineId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["engineId"],
            message: "engineId is required",
          });
        }
        break;

      case "TRIM":
        if (!data.trimId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["trimId"],
            message: "trimId is required",
          });
        }
        break;

      case "EXACT_MATCH":
        if (
          !data.makeId ||
          !data.modelId ||
          !data.generationId ||
          !data.engineId ||
          !data.trimId
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["level"],
            message: "EXACT_MATCH requires full vehicle hierarchy",
          });
        }
        break;
    }
  }
);

// Create schema (full object, with superRefine)
export const createProductFitmentSchema = productFitmentBaseSchema;

// Update schema (partial, with optional productId)
export const updateProductFitmentSchema = productFitmentBaseObjectSchema
  .partial()
  .extend({
    productId: uuidSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // Reapply the same validation logic for partial updates
    if (
      data.yearStart !== undefined &&
      data.yearEnd !== undefined &&
      data.yearEnd < data.yearStart
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["yearEnd"],
        message: "yearEnd must be greater than or equal to yearStart",
      });
    }

    if (data.level) {
      switch (data.level) {
        case "MAKE":
          if (!data.makeId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["makeId"],
              message: "makeId is required for MAKE fitment",
            });
          }
          break;

        case "MODEL":
          if (!data.makeId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["makeId"],
              message: "makeId is required",
            });
          }
          if (!data.modelId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["modelId"],
              message: "modelId is required",
            });
          }
          break;

        case "GENERATION":
          if (!data.generationId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["generationId"],
              message: "generationId is required",
            });
          }
          break;

        case "ENGINE":
          if (!data.engineId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["engineId"],
              message: "engineId is required",
            });
          }
          break;

        case "TRIM":
          if (!data.trimId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["trimId"],
              message: "trimId is required",
            });
          }
          break;

        case "EXACT_MATCH":
          if (
            !data.makeId ||
            !data.modelId ||
            !data.generationId ||
            !data.engineId ||
            !data.trimId
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["level"],
              message: "EXACT_MATCH requires full vehicle hierarchy",
            });
          }
          break;
      }
    }
  });

//////////////////////////////////////////////////////////
// PRODUCT FITMENT OEM
//////////////////////////////////////////////////////////

export const createProductFitmentOEMSchema = z.object({
  productFitmentId: uuidSchema,
  oemReferenceId: uuidSchema,
});

export const updateProductFitmentOEMSchema = createProductFitmentOEMSchema.partial();

//////////////////////////////////////////////////////////
// PRODUCT FITMENT CROSS REFERENCE
//////////////////////////////////////////////////////////

export const createProductFitmentCrossReferenceSchema = z.object({
  productFitmentId: uuidSchema,
  crossReferenceId: uuidSchema,
});

export const updateProductFitmentCrossReferenceSchema = createProductFitmentCrossReferenceSchema.partial();

//////////////////////////////////////////////////////////
// PARAMS
//////////////////////////////////////////////////////////

export const fitmentIdParamSchema = z.object({
  fitmentId: uuidSchema,
});

export const oemReferenceIdParamSchema = z.object({
  oemReferenceId: uuidSchema,
});

export const crossReferenceIdParamSchema = z.object({
  crossReferenceId: uuidSchema,
});

//////////////////////////////////////////////////////////
// QUERY SCHEMAS
//////////////////////////////////////////////////////////

export const getProductFitmentsQuerySchema = paginationSchema.extend({
  productId: uuidSchema.optional(),
  level: fitmentLevelSchema.optional(),
  type: fitmentTypeSchema.optional(),
  makeId: uuidSchema.optional(),
  modelId: uuidSchema.optional(),
  generationId: uuidSchema.optional(),
  engineId: uuidSchema.optional(),
  trimId: uuidSchema.optional(),
  isUniversal: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),
});

export const fitmentResolutionQuerySchema = z.object({
  productId: uuidSchema,
  makeId: uuidSchema.optional(),
  modelId: uuidSchema.optional(),
  generationId: uuidSchema.optional(),
  engineId: uuidSchema.optional(),
  trimId: uuidSchema.optional(),
  oemNumbers: z.array(z.string()).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
});

export type FitmentResolutionQuery =
  z.infer<typeof fitmentResolutionQuerySchema>;
