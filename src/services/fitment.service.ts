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
  findCompatibleProductsSchema,
} from '../schemas/fitment.schema.js';
import { z } from 'zod';
import type { PrismaInstance, PrismaTransaction } from "../lib/prismadb.js";

// ======================
// TYPES
// ======================

type ScorableFitment = {
  productId: string;
  makeId?: string | null;
  modelId?: string | null;
  generationId?: string | null;
  engineId?: string | null;
  trimId?: string | null;
  year?: number | null;
  isUniversal?: boolean | null;
};

type ScoreBreakdown = {
  base: number;
  trimBonus: number;
  engineBonus: number;
  engineFallbackBonus: number;
  generationBonus: number;
  yearPenalty: number;
  universalOverride: boolean;
  final: number;
  level: FitmentLevel;
  type: FitmentType;
};

type VehicleHierarchyInput = {
  makeId?: string | null;
  modelId?: string | null;
  generationId?: string | null;
  engineId?: string | null;
  trimId?: string | null;
};

type PrismaVehicleInput = {
  makeId: string | null;
  modelId: string | null;
  generationId: string | null;
  engineId: string | null;
  trimId: string | null;
};

type StrictVehicleQuery = {
  makeId: string;
  modelId: string;
  generationId?: string;
  engineId?: string;
  trimId?: string;
  year?: number;
};

type VehicleQuery = Partial<StrictVehicleQuery>;
type FitmentResolutionQuery = z.infer<typeof fitmentResolutionQuerySchema>;

// ======================
// SERVICE
// ======================

export class FitmentService {
  constructor(private prisma: PrismaInstance) {}

  // Config cache
  private cachedConfig: FitmentServiceConfig | null = null;
  private configLoadedAt: number | null = null;
  private readonly CONFIG_TTL_MS = 30000; // 30 seconds

  // Track ongoing rebuilds to prevent race conditions
  private rebuildingProducts = new Set<string>();

  // ======================
  // HELPERS
  // ======================

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
    entry: ScorableFitment,
    vehicle: VehicleQuery,
    config: FitmentServiceConfig,
    engineSet: Set<string> | null
  ): {
    score: number;
    level: FitmentLevel;
    type: FitmentType;
    breakdown: ScoreBreakdown;
  } {
    const { engineId, generationId, trimId, year } = vehicle;

    let base = config.weightModel;
    let trimBonus = 0;
    let engineBonus = 0;
    let engineFallbackBonus = 0;
    let generationBonus = 0;
    let yearPenalty = 0;
    let level: FitmentLevel = "MODEL";
    const type: FitmentType = "EXACT";
    let universalOverride = false;

    if (entry.isUniversal) {
      const final = config.weightMake;
      return {
        score: final,
        level: "GLOBAL",
        type: "UNIVERSAL",
        breakdown: {
          base,
          trimBonus,
          engineBonus,
          engineFallbackBonus,
          generationBonus,
          yearPenalty: 0,
          universalOverride: true,
          final,
          level: "GLOBAL",
          type: "UNIVERSAL",
        },
      };
    }

    let score = base;

    if (trimId && entry.trimId === trimId) {
      trimBonus = config.weightTrim - base;
      score = config.weightTrim;
      level = "TRIM";
    } else if (engineId && entry.engineId === engineId) {
      engineBonus = config.weightEngine - base;
      score = config.weightEngine;
      level = "ENGINE";
    } else if (
      !engineId &&
      engineSet &&
      entry.engineId &&
      engineSet.has(entry.engineId)
    ) {
      engineFallbackBonus = Math.floor(config.weightEngine * 0.75) - base;
      score = Math.floor(config.weightEngine * 0.75);
      level = "ENGINE";
    } else if (generationId && entry.generationId === generationId) {
      generationBonus = config.weightGeneration - base;
      score = config.weightGeneration;
      level = "GENERATION";
    }

    if (year && entry.year !== year) {
      const before = score;
      score = config.allowCrossGenerationMatch
        ? Math.floor(score * 0.9)
        : 0;
      yearPenalty = score - before;
    }

    return {
      score,
      level,
      type,
      breakdown: {
        base,
        trimBonus,
        engineBonus,
        engineFallbackBonus,
        generationBonus,
        yearPenalty,
        universalOverride,
        final: score,
        level,
        type,
      },
    };
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
      const engineIds = await this.getEngineIdsByGeneration(
        this.prisma,
        vehicle.generationId
      );
      engineSet = new Set(engineIds);
    }

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
      const engineIds = await this.getEngineIdsByGeneration(
        this.prisma,
        vehicle.generationId
      );
      engineSet = new Set(engineIds);
    }

    const indexResults = config.enableFitmentIndexing
      ? await this.resolveViaIndex(vehicle as any, config)
      : [];

    const directResults = !config.enableFitmentIndexing
      ? await this.resolveViaDirectQuery(vehicle as any, config)
      : [];

    const oemResults =
      vehicle.productId && vehicle.oemNumbers?.length
        ? await this.resolveOEMMatches(
            vehicle.productId,
            vehicle.oemNumbers
          )
        : [];

    const normalizedOEM = oemResults.map((f) => ({
      productId: f.productId,
      score: config.weightMake,
      level: "OEM_MATCH" as FitmentLevel,
      type: f.type ?? ("OEM_MATCH" as FitmentType),
    }));

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

    // Sort only the top 100 results to avoid O(n log n) for large datasets
    const sortedResults = [...results.values()].sort((a, b) => b.score - a.score);
    return sortedResults.slice(0, 100);
  }

  // ======================
  // SERVICE CONFIG
  // ======================

  async getServiceConfig(): Promise<FitmentServiceConfig> {
    const now = Date.now();
    if (
      this.cachedConfig &&
      this.configLoadedAt &&
      now - this.configLoadedAt < this.CONFIG_TTL_MS
    ) {
      return this.cachedConfig;
    }

    const config = await this.prisma.fitmentServiceConfig.findFirst();
    if (!config) throw new Error('No FitmentServiceConfig found. Please seed one.');

    this.cachedConfig = config;
    this.configLoadedAt = now;
    return config;
  }

  async updateServiceConfig(
    data: z.infer<typeof updateFitmentServiceConfigSchema>
  ): Promise<FitmentServiceConfig> {
    const existing = await this.getServiceConfig();
    const validated = updateFitmentServiceConfigSchema.parse(data);

    this.cachedConfig = null; // Invalidate cache

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

    const fitment = await this.prisma.$transaction(
      async (tx) => {
        await this.validateVehicleHierarchy(tx, normalizedInput);
        return tx.productFitment.create({ data: createData });
      },
      { timeout: 15000 }
    );

    // Fire-and-forget index rebuild with race condition prevention
    this.rebuildFitmentIndexForProductAsync(fitment.productId);

    return fitment;
  }

  async updateProductFitment(
    id: string,
    data: z.infer<typeof updateProductFitmentSchema>
  ): Promise<ProductFitment> {
    const validated = updateProductFitmentSchema.parse(data);
    const fitment = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.productFitment.findUnique({ where: { id } });
        if (!existing) throw new Error("ProductFitment not found");

        const normalizedExisting = this.normalizeVehicleInput({
          makeId: existing.makeId,
          modelId: existing.modelId,
          generationId: existing.generationId,
          engineId: existing.engineId,
          trimId: existing.trimId,
        });

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

    // Fire-and-forget index rebuild with race condition prevention
    this.rebuildFitmentIndexForProductAsync(fitment.productId);

    return fitment;
  }

  async deleteProductFitment(id: string): Promise<{ success: boolean }> {
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

    // Fire-and-forget index rebuild with race condition prevention
    this.rebuildFitmentIndexForProductAsync(productId);

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

    const CHUNK_SIZE = 5000;
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

        if (indexEntries.length >= CHUNK_SIZE) {
          await tx.fitmentIndex.createMany({ data: indexEntries });
          indexEntries.length = 0;
        }
      }
    }

    if (indexEntries.length) {
      await tx.fitmentIndex.createMany({ data: indexEntries });
    }
  }

  private async rebuildFitmentIndexForProductAsync(productId: string): Promise<void> {
    // Prevent race conditions for the same product
    if (this.rebuildingProducts.has(productId)) {
      return;
    }
    this.rebuildingProducts.add(productId);

    try {
      await this.prisma.$transaction(
        async (tx) => {
          await this.rebuildFitmentIndexForProduct(tx, productId);
        },
        { timeout: 30000 }
      );
    } catch (error) {
      console.error(`Failed to rebuild fitment index for product ${productId}:`, error);
    } finally {
      this.rebuildingProducts.delete(productId);
    }
  }

  async rebuildFullFitmentIndex(): Promise<void> {
    // Clear old index rows first
    await this.prisma.fitmentIndex.deleteMany();

    // Load all fitments at once
    const allFitments = await this.prisma.productFitment.findMany({
      include: {
        make: true,
        model: true,
        generation: true,
        engine: true,
        trim: true,
      },
    });

    // Build all index rows in memory
    const indexEntries: Prisma.FitmentIndexCreateManyInput[] = [];
    const CHUNK_SIZE = 5000;

    for (const f of allFitments) {
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

        if (indexEntries.length >= CHUNK_SIZE) {
          await this.prisma.fitmentIndex.createMany({ data: indexEntries });
          indexEntries.length = 0;
        }
      }
    }

    // Insert remaining entries
    if (indexEntries.length) {
      await this.prisma.fitmentIndex.createMany({ data: indexEntries });
    }
  }

  // ======================
  // RESOLUTION
  // ======================

  async resolveFitment(query: FitmentResolutionQuery) {
    const validated = fitmentResolutionQuerySchema.parse(query);
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
      const engineIds = await this.getEngineIdsByGeneration(
        this.prisma,
        generationId
      );
      expandedEngineIds = engineIds;
      engineSet = new Set(expandedEngineIds);
    }

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
      take: 1000,
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
      const engineIds = await this.getEngineIdsByGeneration(
        this.prisma,
        generationId
      );
      expandedEngineIds = engineIds;
      engineSet = new Set(expandedEngineIds);
    }

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
      take: 1000,
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
    const [trim, engine, generation, model] = await Promise.all([
      data.trimId
        ? tx.vehicleTrim.findUnique({
            where: { id: data.trimId },
            select: { id: true, engineId: true },
          })
        : Promise.resolve(null),
      data.engineId
        ? tx.vehicleEngine.findUnique({
            where: { id: data.engineId },
            select: { id: true, generationId: true },
          })
        : Promise.resolve(null),
      data.generationId
        ? tx.vehicleGeneration.findUnique({
            where: { id: data.generationId },
            select: { id: true, modelId: true },
          })
        : Promise.resolve(null),
      data.modelId
        ? tx.vehicleModel.findUnique({
            where: { id: data.modelId },
            select: { id: true, makeId: true },
          })
        : Promise.resolve(null),
    ]);

    if (data.trimId && !trim) {
      throw new Error("Vehicle trim not found");
    }
    if (data.trimId && data.engineId && trim?.engineId !== data.engineId) {
      throw new Error("Invalid vehicle hierarchy: trim does not belong to engine");
    }

    if (data.engineId && !engine) {
      throw new Error("Vehicle engine not found");
    }
    if (data.engineId && data.generationId && engine?.generationId !== data.generationId) {
      throw new Error("Invalid vehicle hierarchy: engine does not belong to generation");
    }

    if (data.generationId && !generation) {
      throw new Error("Vehicle generation not found");
    }
    if (data.generationId && data.modelId && generation?.modelId !== data.modelId) {
      throw new Error("Invalid vehicle hierarchy: generation does not belong to model");
    }

    if (data.modelId && !model) {
      throw new Error("Vehicle model not found");
    }
    if (data.modelId && data.makeId && model?.makeId !== data.makeId) {
      throw new Error("Invalid vehicle hierarchy: model does not belong to make");
    }
  }

  // ======================
  // COMPATIBLE PRODUCTS
  // ======================

  async findCompatibleProducts(
    query: z.infer<typeof findCompatibleProductsSchema>
  ): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const validated = findCompatibleProductsSchema.parse(query);
    const config = await this.getServiceConfig();

    if (config.enableFitmentIndexing) {
      return this.findCompatibleProductsViaIndex(validated);
    }
    return this.findCompatibleProductsDirect(validated);
  }

  private async findCompatibleProductsDirect(
    query: z.infer<typeof findCompatibleProductsSchema>
  ): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      makeId,
      modelId,
      generationId,
      engineId,
      trimId,
      year,
      verifiedOnly,
      page,
      limit,
    } = query;

    if (!makeId || !modelId) {
      return { items: [], total: 0, page, limit };
    }

    const vehicleQuery = {
      makeId,
      modelId,
      ...(generationId ? { generationId } : {}),
      ...(engineId ? { engineId } : {}),
      ...(trimId ? { trimId } : {}),
      ...(year !== undefined ? { year } : {}),
    };

    const results = await this.searchFitments(vehicleQuery);
    if (!results.length) {
      return { items: [], total: 0, page, limit };
    }

    const productIds = results.map(r => r.productId);
    const skip = (page - 1) * limit;
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        ...(verifiedOnly ? { isVerified: true } : {}),
      },
      skip,
      take: limit,
    });

    const map = new Map(products.map(p => [p.id, p]));
    return {
      items: productIds
        .slice(skip, skip + limit)
        .map(id => map.get(id))
        .filter((p): p is Product => Boolean(p)),
      total: results.length,
      page,
      limit,
    };
  }

  private async findCompatibleProductsViaIndex(
    query: z.infer<typeof findCompatibleProductsSchema>
  ): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      makeId,
      modelId,
      generationId,
      engineId,
      trimId,
      year,
      verifiedOnly,
      page,
      limit,
    } = query;

    const config = await this.getServiceConfig();
    if (!makeId || !modelId) {
      return { items: [], total: 0, page, limit };
    }

    const skip = (page - 1) * limit;
    const indexEntries = await this.prisma.fitmentIndex.findMany({
      where: {
        makeId,
        modelId,
        ...(generationId ? { generationId } : {}),
        ...(engineId ? { engineId } : {}),
        ...(trimId ? { trimId } : {}),
        ...(year ? { year } : {}),
      },
      skip,
      take: limit,
    });

    if (!indexEntries.length) {
      return { items: [], total: 0, page, limit };
    }

    const productScoreMap = new Map<string, number>();
    for (const entry of indexEntries) {
      let score = config.weightModel;
      if (entry.trimId) score = config.weightTrim;
      else if (entry.engineId) score = config.weightEngine;
      else if (entry.generationId) score = config.weightGeneration;

      if (year && entry.year !== year) {
        score = config.allowCrossGenerationMatch
          ? Math.floor(score * 0.9)
          : 0;
      }

      const prev = productScoreMap.get(entry.productId);
      if (!prev || score > prev) {
        productScoreMap.set(entry.productId, score);
      }
    }

    const ranked = [...productScoreMap.entries()].sort((a, b) => b[1] - a[1]);
    const total = ranked.length;
    const pageSlice = ranked.slice(skip, skip + limit);
    const productIds = pageSlice.map(([id]) => id);

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        ...(verifiedOnly ? { isVerified: true } : {}),
      },
    });

    const map = new Map(products.map((p) => [p.id, p]));
    return {
      items: productIds
        .map((id) => map.get(id))
        .filter((p): p is Product => Boolean(p)),
      total,
      page,
      limit,
    };
  }
}