/*
  Warnings:

  - A unique constraint covering the columns `[modelId,name]` on the table `VehicleGeneration` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "VehicleGeneration_modelId_name_idx";

-- CreateIndex
CREATE UNIQUE INDEX "VehicleGeneration_modelId_name_key" ON "VehicleGeneration"("modelId", "name");
