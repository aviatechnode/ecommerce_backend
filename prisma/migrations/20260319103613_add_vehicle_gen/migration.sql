/*
  Warnings:

  - A unique constraint covering the columns `[generationId,engineCode]` on the table `VehicleEngine` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[engineId,name]` on the table `VehicleTrim` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "VehicleEngine_generationId_engineCode_idx";

-- DropIndex
DROP INDEX "VehicleGeneration_modelId_yearStart_yearEnd_idx";

-- DropIndex
DROP INDEX "VehicleTrim_engineId_name_idx";

-- CreateIndex
CREATE UNIQUE INDEX "VehicleEngine_generationId_engineCode_key" ON "VehicleEngine"("generationId", "engineCode");

-- CreateIndex
CREATE INDEX "VehicleGeneration_modelId_name_idx" ON "VehicleGeneration"("modelId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleTrim_engineId_name_key" ON "VehicleTrim"("engineId", "name");
