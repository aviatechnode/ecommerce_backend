import { prisma } from "../src/lib/prismadb";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

/* =========================================================
   ESM __dirname FIX
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   TYPES
========================================================= */

type FitmentRecord = {
  makeName: string;
  makeSlug: string;

  modelName: string;
  modelSlug: string;

  generationName: string;
  generationSlug?: string;
  chassisCode?: string;

  yearStart: number;
  yearEnd?: number;

  engineCode: string;
  engineName?: string;

  fuelType?: string;
  aspiration?: string;

  cylinders?: number;
  horsepower?: number;

  displacementCc?: number;
  displacementLabel?: string;

  drivetrain?: string;
  transmissionType?: string;

  trimName: string;

  bodyType?: string;
  doors?: number;

  isActive?: boolean;
};

/* =========================================================
   HELPERS
========================================================= */

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

/* =========================================================
   BATCH SIZE (performance tuning)
========================================================= */

const BATCH_SIZE = 50;

/* =========================================================
   MAIN SEED
========================================================= */

async function main() {
  console.log("🚗 Vehicle Fitment Seeding Started...\n");

  const filePath = path.join(
    __dirname,
    "vehicle_fitments_2000_2026.json"
  );

  const raw = await fs.readFile(filePath, "utf-8");
  const records: FitmentRecord[] = JSON.parse(raw);

  console.log(`📦 Loaded ${records.length} records\n`);

  let processed = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (row) => {
        try {
          /* =====================================================
             MAKE
          ===================================================== */

          const make = await prisma.vehicleMake.upsert({
            where: { name: row.makeName },
            update: { isActive: row.isActive ?? true },
            create: {
              name: row.makeName,
              slug: row.makeSlug || slugify(row.makeName),
              isActive: row.isActive ?? true,
            },
          });

          /* =====================================================
             MODEL
          ===================================================== */

          const model = await prisma.vehicleModel.upsert({
            where: {
              makeId_name: {
                makeId: make.id,
                name: row.modelName,
              },
            },
            update: { isActive: row.isActive ?? true },
            create: {
              makeId: make.id,
              name: row.modelName,
              slug: row.modelSlug || slugify(row.modelName),
              isActive: row.isActive ?? true,
            },
          });

          /* =====================================================
             GENERATION
          ===================================================== */

          const generation = await prisma.vehicleGeneration.upsert({
            where: {
              modelId_name: {
                modelId: model.id,
                name: row.generationName,
              },
            },
            update: {
              yearStart: row.yearStart,
              yearEnd: row.yearEnd,
              chassisCode: row.chassisCode,
              isActive: row.isActive ?? true,
            },
            create: {
              modelId: model.id,
              name: row.generationName,
              slug: row.generationSlug || slugify(row.generationName),
              chassisCode: row.chassisCode,
              yearStart: row.yearStart,
              yearEnd: row.yearEnd,
              isActive: row.isActive ?? true,
            },
          });

          /* =====================================================
             ENGINE
          ===================================================== */

          const engine = await prisma.vehicleEngine.upsert({
            where: {
              generationId_engineCode: {
                generationId: generation.id,
                engineCode: row.engineCode,
              },
            },
            update: {
              engineName: row.engineName,
              fuelType: row.fuelType,
              aspiration: row.aspiration,
              cylinders: row.cylinders,
              horsepower: row.horsepower,
              displacementCc: row.displacementCc,
              drivetrain: row.drivetrain,
              transmissionType: row.transmissionType,
              isActive: row.isActive ?? true,
            },
            create: {
              generationId: generation.id,
              engineCode: row.engineCode,
              engineName: row.engineName,
              fuelType: row.fuelType,
              aspiration: row.aspiration,
              cylinders: row.cylinders,
              horsepower: row.horsepower,
              displacementCc: row.displacementCc,
              displacementLabel: row.displacementLabel,
              drivetrain: row.drivetrain,
              transmissionType: row.transmissionType,
              isActive: row.isActive ?? true,
            },
          });

          /* =====================================================
             TRIM
          ===================================================== */

          await prisma.vehicleTrim.upsert({
            where: {
              engineId_name: {
                engineId: engine.id,
                name: row.trimName,
              },
            },
            update: {
              bodyType: row.bodyType,
              doors: row.doors,
              isActive: row.isActive ?? true,
            },
            create: {
              engineId: engine.id,
              name: row.trimName,
              bodyType: row.bodyType,
              doors: row.doors,
              isActive: row.isActive ?? true,
            },
          });

          processed++;
        } catch (err) {
          console.error(
            `❌ Failed: ${row.makeName} ${row.modelName} ${row.yearStart}`,
            err
          );
        }
      })
    );

    console.log(`⚡ Processed: ${Math.min(i + BATCH_SIZE, records.length)} / ${records.length}`);
  }

  console.log(`\n🎉 Done! Total processed: ${processed}`);
}

/* =========================================================
   EXECUTION
========================================================= */

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });