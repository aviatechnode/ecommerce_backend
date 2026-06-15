import { FitmentLevel, FitmentType } from "@prisma/client";
import { prisma } from "../src/lib/prismadb.js";

/* =========================================================
   FITMENT SERVICE CONFIG
========================================================= */

const DEFAULT_CONFIG = {
  name: "Default Fitment Service Config",
  description:
    "Production fitment resolution configuration",

  isActive: true,

  allowUniversalFallback: true,
  allowCrossGenerationMatch: false,
  allowEngineFallback: false,

  weightMake: 100,
  weightModel: 200,
  weightGeneration: 300,
  weightEngine: 400,
  weightTrim: 500,
  weightYear: 250,

  enableFitmentIndexing: true,
  enableTextSearchFallback: true,
};

/* =========================================================
   FITMENT TYPE RULES
=========================================================

   Priority:
   1   = strongest match
   100 = weakest match

   Match hierarchy:

   EXACT_MATCH
   TRIM
   ENGINE
   GENERATION
   MODEL
   MAKE
   GLOBAL

========================================================= */

const FITMENT_RULES = [
  {
    type: FitmentType.EXACT,
    level: FitmentLevel.EXACT_MATCH,

    priority: 1,

    requiresMake: true,
    requiresModel: true,
    requiresGeneration: true,
    requiresEngine: true,
    requiresTrim: true,
    requiresYear: true,

    allowYearRange: false,
    strictMatching: true,
  },

  {
    type: FitmentType.TRIM_SPECIFIC,
    level: FitmentLevel.TRIM,

    priority: 5,

    requiresMake: true,
    requiresModel: true,
    requiresGeneration: true,
    requiresEngine: true,
    requiresTrim: true,
    requiresYear: false,

    allowYearRange: true,
    strictMatching: true,
  },

  {
    type: FitmentType.ENGINE_SPECIFIC,
    level: FitmentLevel.ENGINE,

    priority: 10,

    requiresMake: true,
    requiresModel: true,
    requiresGeneration: true,
    requiresEngine: true,
    requiresTrim: false,
    requiresYear: false,

    allowYearRange: true,
    strictMatching: true,
  },

  {
    type: FitmentType.GENERATION_ONLY,
    level: FitmentLevel.GENERATION,

    priority: 20,

    requiresMake: true,
    requiresModel: true,
    requiresGeneration: true,
    requiresEngine: false,
    requiresTrim: false,
    requiresYear: false,

    allowYearRange: true,
    strictMatching: false,
  },

  {
    type: FitmentType.RANGE,
    level: FitmentLevel.MODEL,

    priority: 30,

    requiresMake: true,
    requiresModel: true,
    requiresGeneration: false,
    requiresEngine: false,
    requiresTrim: false,
    requiresYear: true,

    allowYearRange: true,
    strictMatching: false,
  },

  {
    type: FitmentType.OEM_MATCH,
    level: FitmentLevel.MODEL,

    priority: 40,

    requiresMake: true,
    requiresModel: true,
    requiresGeneration: false,
    requiresEngine: false,
    requiresTrim: false,
    requiresYear: false,

    allowYearRange: true,
    strictMatching: false,
  },

  {
    type: FitmentType.CROSS_REFERENCE,
    level: FitmentLevel.MODEL,

    priority: 50,

    requiresMake: true,
    requiresModel: true,
    requiresGeneration: false,
    requiresEngine: false,
    requiresTrim: false,
    requiresYear: false,

    allowYearRange: true,
    strictMatching: false,
  },

  {
    type: FitmentType.UNIVERSAL,
    level: FitmentLevel.GLOBAL,

    priority: 100,

    requiresMake: false,
    requiresModel: false,
    requiresGeneration: false,
    requiresEngine: false,
    requiresTrim: false,
    requiresYear: false,

    allowYearRange: true,
    strictMatching: false,
  },
] as const;

/* =========================================================
   MAIN
========================================================= */

async function seedConfig() {
  await prisma.fitmentServiceConfig.updateMany({
    data: {
      isActive: false,
    },
  });

  const config =
    await prisma.fitmentServiceConfig.upsert({
      where: {
        name: DEFAULT_CONFIG.name,
      },
      update: {
        ...DEFAULT_CONFIG,
        isActive: true,
      },
      create: DEFAULT_CONFIG,
    });

  console.log(
    `✅ FitmentServiceConfig seeded (${config.id})`
  );
}

async function seedRules() {
  for (const rule of FITMENT_RULES) {
    await prisma.fitmentTypeRule.upsert({
      where: {
        type_level: {
          type: rule.type,
          level: rule.level,
        },
      },
      update: {
        priority: rule.priority,

        requiresMake: rule.requiresMake,
        requiresModel: rule.requiresModel,
        requiresGeneration:
          rule.requiresGeneration,
        requiresEngine: rule.requiresEngine,
        requiresTrim: rule.requiresTrim,
        requiresYear: rule.requiresYear,

        allowYearRange: rule.allowYearRange,
        strictMatching: rule.strictMatching,
      },
      create: {
        ...rule,
      },
    });
  }

  console.log(
    `✅ ${FITMENT_RULES.length} FitmentTypeRules seeded`
  );
}

async function main() {
  console.log(
    "🌱 Seeding Fitment System..."
  );

  await prisma.$transaction(async () => {
    await seedConfig();
    await seedRules();
  });

  console.log(
    "✅ OEMReference seed skipped (production-safe)"
  );

  console.log(
    "✅ CrossReference seed skipped (production-safe)"
  );

  console.log(
    "\n🎉 Fitment System seeding completed successfully!"
  );
}

main()
  .catch((error) => {
    console.error(
      "❌ Fitment seed failed:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });