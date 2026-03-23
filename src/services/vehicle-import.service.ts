import fs from "fs";
import csv from "csv-parser";
import { prisma } from "../lib/prismadb.js";

//////////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////////

type VehicleCSVRow = {
  make: string;
  model: string;
  generation: string;
  yearStart: string;
  yearEnd?: string;
  engine: string;
  displacement?: string;
  trim: string;
};

//////////////////////////////////////////////////////////
// IMPORT VEHICLES
//////////////////////////////////////////////////////////

export const importVehiclesFromCSV = async (filePath: string) => {
  const rows: VehicleCSVRow[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: VehicleCSVRow) => rows.push(data))
      .on("end", async () => {
        try {
          await prisma.$transaction(async (tx) => {
            for (const row of rows) {
              //////////////////////////////////////////////////////////
              // MAKE
              //////////////////////////////////////////////////////////
              const make = await tx.vehicleMake.upsert({
                where: { name: row.make },
                update: {},
                create: { name: row.make },
              });

              //////////////////////////////////////////////////////////
              // MODEL
              //////////////////////////////////////////////////////////
              const model = await tx.vehicleModel.upsert({
                where: {
                  makeId_name: {
                    makeId: make.id,
                    name: row.model,
                  },
                },
                update: {},
                create: {
                  name: row.model,
                  makeId: make.id,
                },
              });

              //////////////////////////////////////////////////////////
              // GENERATION
              //////////////////////////////////////////////////////////
              const generation = await tx.vehicleGeneration.create({
                data: {
                  name: row.generation,
                  modelId: model.id,
                  yearStart: Number(row.yearStart),
                  yearEnd: row.yearEnd
                    ? Number(row.yearEnd)
                    : null, // ✅ null is allowed
                },
              });

              //////////////////////////////////////////////////////////
              // ENGINE (FIXED HERE)
              //////////////////////////////////////////////////////////

              const engineData: {
                generationId: string;
                engineCode: string;
                displacement?: string;
              } = {
                generationId: generation.id,
                engineCode: row.engine,
              };

              // ✅ ONLY add if defined (CRITICAL FIX)
              if (row.displacement && row.displacement.trim() !== "") {
                engineData.displacement = row.displacement;
              }

              const engine = await tx.vehicleEngine.create({
                data: engineData,
              });

              //////////////////////////////////////////////////////////
              // TRIM
              //////////////////////////////////////////////////////////
              await tx.vehicleTrim.create({
                data: {
                  engineId: engine.id,
                  name: row.trim,
                },
              });
            }
          });

          resolve(true);
        } catch (err) {
          reject(err);
        }
      })
      .on("error", reject);
  });
};