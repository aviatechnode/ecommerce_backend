/*
  Warnings:

  - A unique constraint covering the columns `[makeId,name]` on the table `VehicleModel` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "VehicleModel_makeId_name_idx";

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_makeId_name_key" ON "VehicleModel"("makeId", "name");
