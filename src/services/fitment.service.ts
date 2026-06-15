import {
  PrismaClient,
  Prisma,
  FitmentLevel,
  FitmentType,
  type FitmentServiceConfig,
  type FitmentTypeRule,
  type OEMReference,
  type CrossReference,
  type ProductFitment,
  type ProductFitmentOEM,
  type ProductFitmentCrossReference,
  type Product,
  type FitmentResolutionLog,
} from '@prisma/client';
import {
  createFitmentServiceConfigSchema,
  updateFitmentServiceConfigSchema,
  createFitmentTypeRuleSchema,
  updateFitmentTypeRuleSchema,
  createOEMReferenceSchema,
  updateOEMReferenceSchema,
  createCrossReferenceSchema,
  updateCrossReferenceSchema,
  createProductFitmentSchema,
  updateProductFitmentSchema,
  createProductFitmentOEMSchema,
  createProductFitmentCrossReferenceSchema,
  getProductFitmentsQuerySchema,
  fitmentResolutionQuerySchema,
} from '../schemas/fitment.schema.js';
import { z } from 'zod';
import type { PrismaInstance, PrismaTransaction } from "../lib/prismadb.js";

// ======================
// TYPES
// ======================

// Input layer (Zod / API) – now uses string | null instead of undefined
type VehicleHierarchyInput = {
  makeId?: string | null;
  modelId?: string | null;
  generationId?: string | null;
  engineId?: string | null;
  trimId?: string | null;
};

// Prisma-safe boundary type (no undefined, only null)
type PrismaVehicleInput = {
  makeId: string | null;
  modelId: string | null;
  generationId: string | null;
  engineId: string | null;
  trimId: string | null;
};

// Internal safe runtime model (NO nulls, NO undefined)
type VehicleResolved = {
  makeId?: string;
  modelId?: string;
  generationId?: string;
  engineId?: string;
  trimId?: string;
};

// Strict query type (for Prisma)
type StrictVehicleQuery = {
  makeId: string;
  modelId: string;
  generationId?: string;
  engineId?: string;
  trimId?: string;
  year?: number;
};

// Query type (partial for flexibility)
type VehicleQuery = Partial<StrictVehicleQuery>;

// Resolution query type
type FitmentResolutionQuery = z.infer<typeof fitmentResolutionQuerySchema>;

// ======================
// SERVICE
// ======================

export class FitmentService {
  constructor(private prisma: PrismaInstance) {}

  // ======================
  // HELPERS
  // ======================

  /**
   * Normalizes Prisma's `null` values to `null` (keeps null) and
   * converts API `undefined` to `null` for Prisma compatibility.
   * This is the key fix for strict optional property mismatches.
   */
  private normalizeVehicleInput(
    input: {
      makeId?: string | null | undefined;
      modelId?: string | null | undefined;
      generationId?: string | null | undefined;
      engineId?: string | null | undefined;
      trimId?: string | null | undefined;
    }
  ): PrismaVehicleInput {
    return {
      makeId: input.makeId ?? null,
      modelId: input.modelId ?? null,
      generationId: input.generationId ?? null,
      engineId: input.engineId ?? null,
      trimId: input.trimId ?? null,
    };
  }

  private async getEngineIdsByGeneration(
    tx: PrismaTransaction,
    generationId: string
  ): Promise<string[]> {
    const engines = await tx.vehicleEngine.findMany({
      where: { generationId },
      select: { id: true },
    });
    return engines.map((e) => e.id);
  }

  private scoreFitment(
    entry: any,
    vehicle: VehicleQuery,
    config: FitmentServiceConfig,
    engineSet: Set<string> | null
  ) {
    const { engineId, generationId, trimId, year } = vehicle;

    let score = config.weightModel;
    let level: FitmentLevel = "MODEL";

    if (trimId && entry.trimId === trimId) {
      level = "TRIM";
      score = config.weightTrim;
    } else if (engineId && entry.engineId === engineId) {
      level = "ENGINE";
      score = config.weightEngine;
    } else if (
      !engineId &&
      engineSet &&
      entry.engineId &&
      engineSet.has(entry.engineId)
    ) {
      level = "ENGINE";
      score = Math.floor(config.weightEngine * 0.75);
    } else if (generationId && entry.generationId === generationId) {
      level = "GENERATION";
      score = config.weightGeneration;
    }

    if (year && entry.year !== year) {
      score = config.allowCrossGenerationMatch
        ? Math.floor(score * 0.9)
        : 0;
    }

    if (entry.isUniversal) {
      score = config.weightMake;
      level = "GLOBAL";
    }

    return { score, level };
  }

  // ======================
  // CORE METHODS
  // ======================

  async checkFitment(
    productId: string,
    vehicle: VehicleQuery
  ): Promise<{
    fit: boolean;
    bestScore: number;
    level: FitmentLevel | null;
  }> {
    const config = await this.getServiceConfig();

    let engineSet: Set<string> | null = null;

    if (
      config.allowEngineFallback &&
      !vehicle.engineId &&
      vehicle.generationId
    ) {
      const engines = await this.prisma.vehicleEngine.findMany({
        where: { generationId: vehicle.generationId },
        select: { id: true },
      });

      engineSet = new Set(engines.map((e) => e.id));
    }

    // ✅ SAFE WHERE BUILDING (strict-mode compliant)
    const fitments = await this.prisma.productFitment.findMany({
      where: {
        productId,
        ...(vehicle.makeId ? { makeId: vehicle.makeId } : {}),
        ...(vehicle.modelId ? { modelId: vehicle.modelId } : {}),
        ...(vehicle.generationId ? { generationId: vehicle.generationId } : {}),
        ...(vehicle.engineId
          ? { engineId: vehicle.engineId }
          : engineSet
          ? { engineId: { in: [...engineSet] } }
          : {}),
        ...(vehicle.trimId ? { trimId: vehicle.trimId } : {}),
        ...(vehicle.year
          ? {
              yearStart: { lte: vehicle.year },
              yearEnd: { gte: vehicle.year },
            }
          : {}),
      },
    });

    if (!fitments.length) {
      return { fit: false, bestScore: 0, level: null };
    }

    let best = {
      score: 0,
      level: null as FitmentLevel | null,
    };

    for (const f of fitments) {
      const scored = this.scoreFitment(f, vehicle, config, engineSet);

      if (scored.score > best.score) {
        best = scored;
      }
    }

    return {
      fit: best.score > 0,
      bestScore: best.score,
      level: best.level,
    };
  }

  async searchFitments(
    vehicle: VehicleQuery & { productId?: string; oemNumbers?: string[] }
  ): Promise<
    Array<{
      productId: string;
      score: number;
      level: FitmentLevel;
      type: FitmentType;
    }>
  > {
    const config = await this.getServiceConfig();

    let engineSet: Set<string> | null = null;

    if (
      config.allowEngineFallback &&
      !vehicle.engineId &&
      vehicle.generationId
    ) {
      const engines = await this.prisma.vehicleEngine.findMany({
        where: { generationId: vehicle.generationId },
        select: { id: true },
      });

      engineSet = new Set(engines.map((e) => e.id));
    }

    // =========================
    // INDEX RESULTS
    // =========================
    const indexResults = config.enableFitmentIndexing
      ? await this.resolveViaIndex(vehicle as any, config)
      : [];

    // =========================
    // DIRECT RESULTS
    // =========================
    const directResults = await this.resolveViaDirectQuery(
      vehicle as any,
      config
    );

    // =========================
    // OEM RESULTS
    // =========================
    const oemResults =
      vehicle.productId && vehicle.oemNumbers?.length
        ? await this.resolveOEMMatches(
            vehicle.productId,
            vehicle.oemNumbers
          )
        : [];

    // Convert OEM matches into scoreable format
    const normalizedOEM = oemResults.map((f) => ({
      productId: f.productId,
      score: config.weightMake, // OEM = strong match signal
      level: "OEM_MATCH" as FitmentLevel,
      type: f.type ?? ("OEM_MATCH" as FitmentType),
    }));

    // =========================
    // MERGE ALL SOURCES
    // =========================
    const allFitments = [...indexResults, ...directResults, ...normalizedOEM];

    if (!allFitments.length) return [];

    const results = new Map<
      string,
      {
        productId: string;
        score: number;
        level: FitmentLevel;
        type: FitmentType;
      }
    >();

    for (const f of allFitments) {
      const existing = results.get(f.productId);

      if (!existing || f.score > existing.score) {
        results.set(f.productId, {
          productId: f.productId,
          score: f.score,
          level: f.level,
          type: f.type,
        });
      }
    }

    return [...results.values()].sort((a, b) => b.score - a.score);
  }

  // ======================
  // SERVICE CONFIG
  // ======================

  async getServiceConfig(): Promise<FitmentServiceConfig> {
    const config = await this.prisma.fitmentServiceConfig.findFirst();
    if (!config) throw new Error('No FitmentServiceConfig found. Please seed one.');
    return config;
  }

  async updateServiceConfig(
    data: z.infer<typeof updateFitmentServiceConfigSchema>
  ): Promise<FitmentServiceConfig> {
    const existing = await this.getServiceConfig();
    const validated = updateFitmentServiceConfigSchema.parse(data);

    const updateData: Prisma.FitmentServiceConfigUpdateInput = {
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.description !== undefined && { description: validated.description }),
      ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      ...(validated.allowUniversalFallback !== undefined && { allowUniversalFallback: validated.allowUniversalFallback }),
      ...(validated.allowCrossGenerationMatch !== undefined && { allowCrossGenerationMatch: validated.allowCrossGenerationMatch }),
      ...(validated.allowEngineFallback !== undefined && { allowEngineFallback: validated.allowEngineFallback }),
      ...(validated.weightMake !== undefined && { weightMake: validated.weightMake }),
      ...(validated.weightModel !== undefined && { weightModel: validated.weightModel }),
      ...(validated.weightGeneration !== undefined && { weightGeneration: validated.weightGeneration }),
      ...(validated.weightEngine !== undefined && { weightEngine: validated.weightEngine }),
      ...(validated.weightTrim !== undefined && { weightTrim: validated.weightTrim }),
      ...(validated.weightYear !== undefined && { weightYear: validated.weightYear }),
      ...(validated.enableFitmentIndexing !== undefined && { enableFitmentIndexing: validated.enableFitmentIndexing }),
      ...(validated.enableTextSearchFallback !== undefined && { enableTextSearchFallback: validated.enableTextSearchFallback }),
    };

    return this.prisma.fitmentServiceConfig.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  // ======================
  // FITMENT TYPE RULES
  // ======================

  async getFitmentTypeRules(): Promise<FitmentTypeRule[]> {
    return this.prisma.fitmentTypeRule.findMany({ orderBy: { priority: 'asc' } });
  }

  async createFitmentTypeRule(
    data: z.infer<typeof createFitmentTypeRuleSchema>
  ): Promise<FitmentTypeRule> {
    const validated = createFitmentTypeRuleSchema.parse(data);

    const createData: Prisma.FitmentTypeRuleCreateInput = {
      type: validated.type,
      level: validated.level,
      ...(validated.priority !== undefined && { priority: validated.priority }),
      ...(validated.requiresMake !== undefined && { requiresMake: validated.requiresMake }),
      ...(validated.requiresModel !== undefined && { requiresModel: validated.requiresModel }),
      ...(validated.requiresGeneration !== undefined && { requiresGeneration: validated.requiresGeneration }),
      ...(validated.requiresEngine !== undefined && { requiresEngine: validated.requiresEngine }),
      ...(validated.requiresTrim !== undefined && { requiresTrim: validated.requiresTrim }),
      ...(validated.requiresYear !== undefined && { requiresYear: validated.requiresYear }),
      ...(validated.allowYearRange !== undefined && { allowYearRange: validated.allowYearRange }),
      ...(validated.strictMatching !== undefined && { strictMatching: validated.strictMatching }),
    };

    return this.prisma.fitmentTypeRule.create({ data: createData });
  }

  async updateFitmentTypeRule(
    id: string,
    data: z.infer<typeof updateFitmentTypeRuleSchema>
  ): Promise<FitmentTypeRule> {
    const validated = updateFitmentTypeRuleSchema.parse(data);

    const updateData: Prisma.FitmentTypeRuleUpdateInput = {
      ...(validated.type !== undefined && { type: validated.type }),
      ...(validated.level !== undefined && { level: validated.level }),
      ...(validated.priority !== undefined && { priority: validated.priority }),
      ...(validated.requiresMake !== undefined && { requiresMake: validated.requiresMake }),
      ...(validated.requiresModel !== undefined && { requiresModel: validated.requiresModel }),
      ...(validated.requiresGeneration !== undefined && { requiresGeneration: validated.requiresGeneration }),
      ...(validated.requiresEngine !== undefined && { requiresEngine: validated.requiresEngine }),
      ...(validated.requiresTrim !== undefined && { requiresTrim: validated.requiresTrim }),
      ...(validated.requiresYear !== undefined && { requiresYear: validated.requiresYear }),
      ...(validated.allowYearRange !== undefined && { allowYearRange: validated.allowYearRange }),
      ...(validated.strictMatching !== undefined && { strictMatching: validated.strictMatching }),
    };

    return this.prisma.fitmentTypeRule.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteFitmentTypeRule(id: string): Promise<FitmentTypeRule> {
    return this.prisma.fitmentTypeRule.delete({ where: { id } });
  }

  // ======================
  // OEM REFERENCES
  // ======================

  async getOEMReferences(): Promise<OEMReference[]> {
    return this.prisma.oEMReference.findMany();
  }

  async createOEMReference(
    data: z.infer<typeof createOEMReferenceSchema>
  ): Promise<OEMReference> {
    const validated = createOEMReferenceSchema.parse(data);

    const createData: Prisma.OEMReferenceCreateInput = {
      manufacturer: validated.manufacturer,
      partNumber: validated.partNumber,
      ...(validated.description !== undefined && { description: validated.description }),
    };

    return this.prisma.oEMReference.create({ data: createData });
  }

  async updateOEMReference(
    id: string,
    data: z.infer<typeof updateOEMReferenceSchema>
  ): Promise<OEMReference> {
    const validated = updateOEMReferenceSchema.parse(data);

    const updateData: Prisma.OEMReferenceUpdateInput = {
      ...(validated.manufacturer !== undefined && { manufacturer: validated.manufacturer }),
      ...(validated.partNumber !== undefined && { partNumber: validated.partNumber }),
      ...(validated.description !== undefined && { description: validated.description }),
    };

    return this.prisma.oEMReference.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteOEMReference(id: string): Promise<OEMReference> {
    return this.prisma.oEMReference.delete({ where: { id } });
  }

  // ======================
  // CROSS REFERENCES
  // ======================

  async getCrossReferences(): Promise<CrossReference[]> {
    return this.prisma.crossReference.findMany();
  }

  async createCrossReference(
    data: z.infer<typeof createCrossReferenceSchema>
  ): Promise<CrossReference> {
    const validated = createCrossReferenceSchema.parse(data);

    const createData: Prisma.CrossReferenceCreateInput = {
      brand: validated.brand,
      partNumber: validated.partNumber,
      ...(validated.description !== undefined && { description: validated.description }),
    };

    return this.prisma.crossReference.create({ data: createData });
  }

  async updateCrossReference(
    id: string,
    data: z.infer<typeof updateCrossReferenceSchema>
  ): Promise<CrossReference> {
    const validated = updateCrossReferenceSchema.parse(data);

    const updateData: Prisma.CrossReferenceUpdateInput = {
      ...(validated.brand !== undefined && { brand: validated.brand }),
      ...(validated.partNumber !== undefined && { partNumber: validated.partNumber }),
      ...(validated.description !== undefined && { description: validated.description }),
    };

    return this.prisma.crossReference.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCrossReference(id: string): Promise<CrossReference> {
    return this.prisma.crossReference.delete({ where: { id } });
  }

  // ======================
  // PRODUCT FITMENTS
  // ======================

  async getProductFitments(
    query: z.infer<typeof getProductFitmentsQuerySchema>
  ): Promise<{ items: ProductFitment[]; total: number; page: number; limit: number }> {
    const { page, limit, ...filters } = getProductFitmentsQuerySchema.parse(query);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductFitmentWhereInput = {
      ...(filters.productId !== undefined && { productId: filters.productId }),
      ...(filters.level !== undefined && { level: filters.level }),
      ...(filters.type !== undefined && { type: filters.type }),
      ...(filters.makeId !== undefined && { makeId: filters.makeId }),
      ...(filters.modelId !== undefined && { modelId: filters.modelId }),
      ...(filters.generationId !== undefined && { generationId: filters.generationId }),
      ...(filters.engineId !== undefined && { engineId: filters.engineId }),
      ...(filters.trimId !== undefined && { trimId: filters.trimId }),
      ...(filters.isUniversal !== undefined && { isUniversal: filters.isUniversal }),
      ...(filters.isVerified !== undefined && { isVerified: filters.isVerified }),
    };

    const [items, total] = await Promise.all([
      this.prisma.productFitment.findMany({
        where,
        include: {
          oemReferences: { include: { oemReference: true } },
          crossReferences: { include: { crossReference: true } },
          make: true,
          model: true,
          generation: true,
          engine: true,
          trim: true,
          product: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productFitment.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async createProductFitment(
    data: z.infer<typeof createProductFitmentSchema>
  ): Promise<ProductFitment> {
    const validated = createProductFitmentSchema.parse(data);

    // Convert API undefined → null for Prisma safety
    const normalizedInput = this.normalizeVehicleInput(validated);

    const createData: Prisma.ProductFitmentCreateInput = {
      product: { connect: { id: validated.productId } },
      level: validated.level,
      type: validated.type,
      ...(normalizedInput.makeId && { make: { connect: { id: normalizedInput.makeId } } }),
      ...(normalizedInput.modelId && { model: { connect: { id: normalizedInput.modelId } } }),
      ...(normalizedInput.generationId && { generation: { connect: { id: normalizedInput.generationId } } }),
      ...(normalizedInput.engineId && { engine: { connect: { id: normalizedInput.engineId } } }),
      ...(normalizedInput.trimId && { trim: { connect: { id: normalizedInput.trimId } } }),
      ...(validated.yearStart !== undefined && { yearStart: validated.yearStart }),
      ...(validated.yearEnd !== undefined && { yearEnd: validated.yearEnd }),
      ...(validated.notes !== undefined && { notes: validated.notes }),
      ...(validated.position !== undefined && { position: validated.position }),
      ...(validated.quantityRequired !== undefined && { quantityRequired: validated.quantityRequired }),
      ...(validated.isUniversal !== undefined && { isUniversal: validated.isUniversal }),
      ...(validated.isVerified !== undefined && { isVerified: validated.isVerified }),
      ...(validated.confidenceScore !== undefined && { confidenceScore: validated.confidenceScore }),
    };

    // Run the write transaction with increased timeout (15 seconds)
    const fitment = await this.prisma.$transaction(
      async (tx) => {
        await this.validateVehicleHierarchy(tx, normalizedInput);
        return tx.productFitment.create({ data: createData });
      },
      { timeout: 15000 } // 15 seconds timeout
    );

    // Rebuild index AFTER commit (long-running, separate transaction)
    await this.rebuildFitmentIndexForProductAsync(fitment.productId);

    return fitment;
  }

  async updateProductFitment(
    id: string,
    data: z.infer<typeof updateProductFitmentSchema>
  ): Promise<ProductFitment> {
    const validated = updateProductFitmentSchema.parse(data);

    // Run the update transaction with increased timeout (15 seconds)
    const fitment = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.productFitment.findUnique({
          where: { id },
        });

        if (!existing) throw new Error("ProductFitment not found");

        // Normalize existing Prisma data (null stays null, no undefined)
        const normalizedExisting = this.normalizeVehicleInput({
          makeId: existing.makeId,
          modelId: existing.modelId,
          generationId: existing.generationId,
          engineId: existing.engineId,
          trimId: existing.trimId,
        });

        // Safe merging: validated data takes precedence, then existing (both are string | null)
        const vehicleForValidation: VehicleHierarchyInput = {
          makeId: validated.makeId ?? normalizedExisting.makeId,
          modelId: validated.modelId ?? normalizedExisting.modelId,
          generationId: validated.generationId ?? normalizedExisting.generationId,
          engineId: validated.engineId ?? normalizedExisting.engineId,
          trimId: validated.trimId ?? normalizedExisting.trimId,
        };

        await this.validateVehicleHierarchy(tx, vehicleForValidation);

        const updateData: Prisma.ProductFitmentUpdateInput = {
          ...(validated.productId !== undefined && { product: { connect: { id: validated.productId } } }),
          ...(validated.level !== undefined && { level: validated.level }),
          ...(validated.type !== undefined && { type: validated.type }),
          ...(validated.makeId !== undefined && { make: { connect: { id: validated.makeId } } }),
          ...(validated.modelId !== undefined && { model: { connect: { id: validated.modelId } } }),
          ...(validated.generationId !== undefined && { generation: { connect: { id: validated.generationId } } }),
          ...(validated.engineId !== undefined && { engine: { connect: { id: validated.engineId } } }),
          ...(validated.trimId !== undefined && { trim: { connect: { id: validated.trimId } } }),
          ...(validated.yearStart !== undefined && { yearStart: validated.yearStart }),
          ...(validated.yearEnd !== undefined && { yearEnd: validated.yearEnd }),
          ...(validated.notes !== undefined && { notes: validated.notes }),
          ...(validated.position !== undefined && { position: validated.position }),
          ...(validated.quantityRequired !== undefined && { quantityRequired: validated.quantityRequired }),
          ...(validated.isUniversal !== undefined && { isUniversal: validated.isUniversal }),
          ...(validated.isVerified !== undefined && { isVerified: validated.isVerified }),
          ...(validated.confidenceScore !== undefined && { confidenceScore: validated.confidenceScore }),
        };

        return tx.productFitment.update({
          where: { id },
          data: updateData,
        });
      },
      { timeout: 15000 }
    );

    // Rebuild index AFTER commit
    await this.rebuildFitmentIndexForProductAsync(fitment.productId);

    return fitment;
  }

  async deleteProductFitment(id: string): Promise<{ success: boolean }> {
    // Run the delete transaction with increased timeout (15 seconds)
    const productId = await this.prisma.$transaction(
      async (tx) => {
        const fitment = await tx.productFitment.findUnique({ where: { id } });
        if (!fitment) throw new Error('ProductFitment not found');
        const pid = fitment.productId;
        await tx.productFitment.delete({ where: { id } });
        return pid;
      },
      { timeout: 15000 }
    );

    // Rebuild index AFTER commit
    await this.rebuildFitmentIndexForProductAsync(productId);

    return { success: true };
  }

  // ======================
  // PRODUCT FITMENT ↔ OEM
  // ======================

  async addOEMReferenceToFitment(
    data: z.infer<typeof createProductFitmentOEMSchema>
  ): Promise<ProductFitmentOEM> {
    const validated = createProductFitmentOEMSchema.parse(data);

    const createData: Prisma.ProductFitmentOEMCreateInput = {
      productFitment: { connect: { id: validated.productFitmentId } },
      oemReference: { connect: { id: validated.oemReferenceId } },
    };

    return this.prisma.productFitmentOEM.create({ data: createData });
  }

  private async resolveOEMMatches(productId: string, oemNumbers: string[]) {
    if (!oemNumbers.length) return [];

    return this.prisma.productFitment.findMany({
      where: {
        productId,
        oemReferences: {
          some: {
            oemReference: {
              partNumber: { in: oemNumbers },
            },
          },
        },
      },
    });
  }

  async removeOEMReferenceFromFitment(
    productFitmentId: string,
    oemReferenceId: string
  ): Promise<ProductFitmentOEM> {
    return this.prisma.productFitmentOEM.delete({
      where: { productFitmentId_oemReferenceId: { productFitmentId, oemReferenceId } },
    });
  }

  // ======================
  // PRODUCT FITMENT ↔ CROSS REFERENCE
  // ======================

  async addCrossReferenceToFitment(
    data: z.infer<typeof createProductFitmentCrossReferenceSchema>
  ): Promise<ProductFitmentCrossReference> {
    const validated = createProductFitmentCrossReferenceSchema.parse(data);

    const createData: Prisma.ProductFitmentCrossReferenceCreateInput = {
      productFitment: { connect: { id: validated.productFitmentId } },
      crossReference: { connect: { id: validated.crossReferenceId } },
    };

    return this.prisma.productFitmentCrossReference.create({ data: createData });
  }

  async removeCrossReferenceFromFitment(
    productFitmentId: string,
    crossReferenceId: string
  ): Promise<ProductFitmentCrossReference> {
    return this.prisma.productFitmentCrossReference.delete({
      where: { productFitmentId_crossReferenceId: { productFitmentId, crossReferenceId } },
    });
  }

  // ======================
  // FITMENT INDEX
  // ======================

  /**
   * Rebuilds the fitment index for a single product.
   * This method is transaction‑safe and can be called with any Prisma transaction client.
   */
  private async rebuildFitmentIndexForProduct(
    tx: PrismaTransaction,
    productId: string
  ): Promise<void> {
    await tx.fitmentIndex.deleteMany({ where: { productId } });

    const fitments = await tx.productFitment.findMany({
      where: { productId },
      include: {
        make: true,
        model: true,
        generation: true,
        engine: true,
        trim: true,
      },
    });

    if (!fitments.length) return;

    const indexEntries: Prisma.FitmentIndexCreateManyInput[] = [];

    for (const f of fitments) {
      if (!f.makeId || !f.modelId) continue;

      const yearStart = f.yearStart ?? f.yearEnd ?? new Date().getFullYear();
      const yearEnd = f.yearEnd ?? yearStart;

      for (let year = yearStart; year <= yearEnd; year++) {
        const entry: Prisma.FitmentIndexCreateManyInput = {
          productId: f.productId,
          makeId: f.makeId,
          make: f.make!.name,
          modelId: f.modelId,
          model: f.model!.name,
          generationId: f.generationId ?? null,
          generation: f.generation?.name ?? null,
          engineId: f.engineId ?? null,
          engineCode: f.engine?.engineCode ?? null,
          trimId: f.trimId ?? null,
          trim: f.trim?.name ?? null,
          year,
          searchableText: `${f.make!.name} ${f.model!.name} ${f.generation?.name ?? ''} ${f.engine?.engineCode ?? ''} ${f.trim?.name ?? ''}`.toLowerCase(),
        };
        indexEntries.push(entry);
      }
    }

    if (indexEntries.length) {
      await tx.fitmentIndex.createMany({ data: indexEntries });
    }
  }

  /**
   * Async wrapper that rebuilds the fitment index in its own transaction.
   * This prevents long index rebuilds from blocking the main write transaction.
   * Errors are logged but never thrown – index rebuild is non‑critical.
   */
  private async rebuildFitmentIndexForProductAsync(productId: string): Promise<void> {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          await this.rebuildFitmentIndexForProduct(tx, productId);
        },
        { timeout: 30000 } // 30 seconds for index rebuild (can be longer)
      );
    } catch (error) {
      console.error(`Failed to rebuild fitment index for product ${productId}:`, error);
      // Do not rethrow – the fitment operation already succeeded.
    }
  }

  async rebuildFullFitmentIndex(): Promise<void> {
    const products = await this.prisma.product.findMany({ select: { id: true } });
    await this.prisma.$transaction(
      async (tx) => {
        await tx.fitmentIndex.deleteMany();
        for (const { id } of products) {
          await this.rebuildFitmentIndexForProduct(tx, id);
        }
      },
      { timeout: 300000 } // 5 minutes for full rebuild
    );
  }

  // ======================
  // RESOLUTION
  // ======================

  async resolveFitment(query: FitmentResolutionQuery) {
    const validated = fitmentResolutionQuerySchema.parse(query);

    // STRICT SAFE NORMALIZATION (fixes exactOptionalPropertyTypes issue)
    const safeQuery: VehicleQuery & { productId: string; oemNumbers?: string[] } = {
      productId: validated.productId,
      ...(validated.makeId ? { makeId: validated.makeId } : {}),
      ...(validated.modelId ? { modelId: validated.modelId } : {}),
      ...(validated.generationId ? { generationId: validated.generationId } : {}),
      ...(validated.engineId ? { engineId: validated.engineId } : {}),
      ...(validated.trimId ? { trimId: validated.trimId } : {}),
      ...(validated.year ? { year: validated.year } : {}),
      ...(validated.oemNumbers?.length ? { oemNumbers: validated.oemNumbers } : {}),
    };

    const log = await this.prisma.fitmentResolutionLog.create({
      data: {
        product: { connect: { id: validated.productId } },
        inputMake: validated.makeId ?? null,
        inputModel: validated.modelId ?? null,
        inputGeneration: validated.generationId ?? null,
        inputEngine: validated.engineId ?? null,
        inputTrim: validated.trimId ?? null,
        inputYear: validated.year ?? null,
        matched: false,
      },
    });

    try {
      const matches = await this.searchFitments(safeQuery);

      const topMatches = matches.slice(0, 10);

      await this.prisma.fitmentResolutionLog.update({
        where: { id: log.id },
        data: {
          matched: topMatches.length > 0,
          matchedLevel: topMatches[0]?.level ?? null,
          matchedType: topMatches[0]?.type ?? null,
          score: topMatches[0]?.score ?? null,
          resolutionPath: JSON.stringify(topMatches),
        },
      });

      const products = await this.prisma.product.findMany({
        where: {
          id: {
            in: [...new Set(topMatches.map((m) => m.productId))],
          },
        },
      });

      const map = new Map(products.map((p) => [p.id, p]));

      return {
        matches: topMatches.map((m) => ({
          product: map.get(m.productId) ?? null,
          score: m.score,
          level: m.level,
          type: m.type,
        })),
      };
    } catch (error) {
      await this.prisma.fitmentResolutionLog.update({
        where: { id: log.id },
        data: {
          notes: `Resolution error: ${String(error)}`,
        },
      });

      throw error;
    }
  }

  private async resolveViaIndex(
    query: FitmentResolutionQuery,
    config: FitmentServiceConfig
  ): Promise<
    Array<{
      productId: string;
      score: number;
      level: FitmentLevel;
      type: FitmentType;
    }>
  > {
    const {
      makeId,
      modelId,
      generationId,
      engineId,
      trimId,
      year,
      productId,
    } = query;

    if (!makeId || !modelId) {
      return [];
    }

    let expandedEngineIds: string[] | null = null;
    let engineSet: Set<string> | null = null;

    if (config.allowEngineFallback && !engineId && generationId) {
      const engines = await this.prisma.vehicleEngine.findMany({
        where: { generationId },
        select: { id: true },
      });

      expandedEngineIds = engines.map((e) => e.id);
      engineSet = new Set(expandedEngineIds);
    }

    // SAFE WHERE BUILD (strict-mode compliant)
    const indexEntries = await this.prisma.fitmentIndex.findMany({
      where: {
        productId,
        makeId,
        modelId,
        ...(generationId ? { generationId } : {}),
        ...(engineId
          ? { engineId }
          : expandedEngineIds
          ? { engineId: { in: expandedEngineIds } }
          : {}),
        ...(trimId ? { trimId } : {}),
        ...(year ? { year } : {}),
      },
    });

    if (!indexEntries.length) return [];

    const results = new Map<
      string,
      {
        productId: string;
        score: number;
        level: FitmentLevel;
        type: FitmentType;
      }
    >();

    for (const entry of indexEntries) {
      let score = config.weightModel;
      let level: FitmentLevel = "MODEL";
      const type: FitmentType = "EXACT";

      if (trimId && entry.trimId === trimId) {
        level = "TRIM";
        score = config.weightTrim;
      } else if (engineId && entry.engineId === engineId) {
        level = "ENGINE";
        score = config.weightEngine;
      } else if (
        !engineId &&
        engineSet &&
        entry.engineId &&
        engineSet.has(entry.engineId)
      ) {
        level = "ENGINE";
        score = Math.floor(config.weightEngine * 0.75);
      } else if (generationId && entry.generationId === generationId) {
        level = "GENERATION";
        score = config.weightGeneration;
      }

      if (year && entry.year !== year) {
        score = config.allowCrossGenerationMatch
          ? Math.floor(score * 0.9)
          : 0;
      }

      const existing = results.get(entry.productId);

      if (!existing || score > existing.score) {
        results.set(entry.productId, {
          productId: entry.productId,
          score,
          level,
          type,
        });
      }
    }

    return Array.from(results.values());
  }

  private async resolveViaDirectQuery(
    query: FitmentResolutionQuery,
    config: FitmentServiceConfig
  ): Promise<
    Array<{
      productId: string;
      score: number;
      level: FitmentLevel;
      type: FitmentType;
    }>
  > {
    const {
      makeId,
      modelId,
      generationId,
      engineId,
      trimId,
      year,
    } = query;

    if (!makeId || !modelId) {
      return [];
    }

    let expandedEngineIds: string[] | null = null;
    let engineSet: Set<string> | null = null;

    if (config.allowEngineFallback && !engineId && generationId) {
      const engines = await this.prisma.vehicleEngine.findMany({
        where: { generationId },
        select: { id: true },
      });

      expandedEngineIds = engines.map((e) => e.id);
      engineSet = new Set(expandedEngineIds);
    }

    // SAFE Prisma WHERE (no undefined leakage)
    const fitments = await this.prisma.productFitment.findMany({
      where: {
        makeId,
        modelId,
        ...(generationId ? { generationId } : {}),
        ...(engineId
          ? { engineId }
          : expandedEngineIds
          ? { engineId: { in: expandedEngineIds } }
          : {}),
        ...(trimId ? { trimId } : {}),
        ...(year
          ? {
              yearStart: { lte: year },
              yearEnd: { gte: year },
            }
          : {}),
      },
    });

    return fitments.map((f) => {
      let score = config.weightModel;
      let level: FitmentLevel = "MODEL";
      const type: FitmentType = f.type;

      if (f.level === "TRIM") {
        level = "TRIM";
        score = config.weightTrim;
      } else if (engineId && f.engineId === engineId) {
        level = "ENGINE";
        score = config.weightEngine;
      } else if (
        !engineId &&
        engineSet &&
        f.engineId &&
        engineSet.has(f.engineId)
      ) {
        level = "ENGINE";
        score = Math.floor(config.weightEngine * 0.75);
      } else if (f.level === "GENERATION") {
        level = "GENERATION";
        score = config.weightGeneration;
      }

      if (f.isUniversal) {
        score = config.weightMake;
        level = "GLOBAL";
      }

      return {
        productId: f.productId,
        score,
        level,
        type,
      };
    });
  }

  // ======================
  // LOGS
  // ======================

  async getResolutionLogs(productId?: string): Promise<FitmentResolutionLog[]> {
    const where: Prisma.FitmentResolutionLogWhereInput = {
      ...(productId !== undefined && { productId }),
    };

    return this.prisma.fitmentResolutionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ======================
  // VALIDATION
  // ======================

  private async validateVehicleHierarchy(
    tx: PrismaTransaction,
    data: VehicleHierarchyInput
  ): Promise<void> {
    // ==========================================
    // TRIM -> ENGINE -> GENERATION -> MODEL -> MAKE
    // ==========================================
    if (data.trimId) {
      const trim = await tx.vehicleTrim.findUnique({
        where: { id: data.trimId },
        select: {
          id: true,
          engineId: true,
        },
      });

      if (!trim) {
        throw new Error("Vehicle trim not found");
      }

      if (data.engineId && trim.engineId !== data.engineId) {
        throw new Error(
          "Invalid vehicle hierarchy: trim does not belong to engine"
        );
      }
    }

    if (data.engineId) {
      const engine = await tx.vehicleEngine.findUnique({
        where: { id: data.engineId },
        select: {
          id: true,
          generationId: true,
        },
      });

      if (!engine) {
        throw new Error("Vehicle engine not found");
      }

      if (
        data.generationId &&
        engine.generationId !== data.generationId
      ) {
        throw new Error(
          "Invalid vehicle hierarchy: engine does not belong to generation"
        );
      }
    }

    if (data.generationId) {
      const generation = await tx.vehicleGeneration.findUnique({
        where: { id: data.generationId },
        select: {
          id: true,
          modelId: true,
        },
      });

      if (!generation) {
        throw new Error("Vehicle generation not found");
      }

      if (
        data.modelId &&
        generation.modelId !== data.modelId
      ) {
        throw new Error(
          "Invalid vehicle hierarchy: generation does not belong to model"
        );
      }
    }

    if (data.modelId) {
      const model = await tx.vehicleModel.findUnique({
        where: { id: data.modelId },
        select: {
          id: true,
          makeId: true,
        },
      });

      if (!model) {
        throw new Error("Vehicle model not found");
      }

      if (data.makeId && model.makeId !== data.makeId) {
        throw new Error(
          "Invalid vehicle hierarchy: model does not belong to make"
        );
      }
    }
  }
}