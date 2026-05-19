/*
  Warnings:

  - You are about to drop the column `displacement` on the `VehicleEngine` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,make,model,year,engineCode]` on the table `FitmentIndex` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,level,makeId,modelId,generationId,engineId,trimId,yearStart,yearEnd]` on the table `ProductFitment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `VehicleMake` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[makeId,slug]` on the table `VehicleModel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `level` to the `ProductFitment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProductFitment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `VehicleEngine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `VehicleGeneration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `VehicleMake` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `VehicleMake` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `VehicleModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `VehicleModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `VehicleTrim` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FitmentLevel" AS ENUM ('MAKE', 'MODEL', 'GENERATION', 'ENGINE', 'TRIM');

-- DropForeignKey
ALTER TABLE "ProductFitment" DROP CONSTRAINT "ProductFitment_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductFitment" DROP CONSTRAINT "ProductFitment_trimId_fkey";

-- DropForeignKey
ALTER TABLE "VehicleEngine" DROP CONSTRAINT "VehicleEngine_generationId_fkey";

-- DropForeignKey
ALTER TABLE "VehicleGeneration" DROP CONSTRAINT "VehicleGeneration_modelId_fkey";

-- DropForeignKey
ALTER TABLE "VehicleModel" DROP CONSTRAINT "VehicleModel_makeId_fkey";

-- DropForeignKey
ALTER TABLE "VehicleTrim" DROP CONSTRAINT "VehicleTrim_engineId_fkey";

-- DropIndex
DROP INDEX "FitmentIndex_productId_make_model_year_key";

-- DropIndex
DROP INDEX "ProductFitment_productId_trimId_key";

-- AlterTable
ALTER TABLE "FitmentIndex" ADD COLUMN     "engineCode" TEXT,
ADD COLUMN     "engineId" TEXT,
ADD COLUMN     "generation" TEXT,
ADD COLUMN     "generationId" TEXT,
ADD COLUMN     "makeId" TEXT,
ADD COLUMN     "modelId" TEXT,
ADD COLUMN     "searchableText" TEXT,
ADD COLUMN     "trim" TEXT,
ADD COLUMN     "trimId" TEXT;

-- AlterTable
ALTER TABLE "ProductFitment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "engineId" TEXT,
ADD COLUMN     "generationId" TEXT,
ADD COLUMN     "isUniversal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "level" "FitmentLevel" NOT NULL,
ADD COLUMN     "makeId" TEXT,
ADD COLUMN     "modelId" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "quantityRequired" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "yearEnd" INTEGER,
ADD COLUMN     "yearStart" INTEGER,
ALTER COLUMN "trimId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VehicleEngine" DROP COLUMN "displacement",
ADD COLUMN     "aspiration" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "cylinders" INTEGER,
ADD COLUMN     "displacementCc" INTEGER,
ADD COLUMN     "displacementLabel" TEXT,
ADD COLUMN     "drivetrain" TEXT,
ADD COLUMN     "engineName" TEXT,
ADD COLUMN     "fuelType" TEXT,
ADD COLUMN     "horsepower" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "transmissionType" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "VehicleGeneration" ADD COLUMN     "chassisCode" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "VehicleMake" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "VehicleModel" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "VehicleTrim" ADD COLUMN     "bodyType" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "doors" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "FitmentIndex_productId_idx" ON "FitmentIndex"("productId");

-- CreateIndex
CREATE INDEX "FitmentIndex_make_idx" ON "FitmentIndex"("make");

-- CreateIndex
CREATE INDEX "FitmentIndex_model_idx" ON "FitmentIndex"("model");

-- CreateIndex
CREATE INDEX "FitmentIndex_year_idx" ON "FitmentIndex"("year");

-- CreateIndex
CREATE INDEX "FitmentIndex_make_model_year_idx" ON "FitmentIndex"("make", "model", "year");

-- CreateIndex
CREATE INDEX "FitmentIndex_makeId_modelId_idx" ON "FitmentIndex"("makeId", "modelId");

-- CreateIndex
CREATE INDEX "FitmentIndex_generationId_idx" ON "FitmentIndex"("generationId");

-- CreateIndex
CREATE INDEX "FitmentIndex_engineId_idx" ON "FitmentIndex"("engineId");

-- CreateIndex
CREATE INDEX "FitmentIndex_trimId_idx" ON "FitmentIndex"("trimId");

-- CreateIndex
CREATE UNIQUE INDEX "FitmentIndex_productId_make_model_year_engineCode_key" ON "FitmentIndex"("productId", "make", "model", "year", "engineCode");

-- CreateIndex
CREATE INDEX "ProductFitment_productId_idx" ON "ProductFitment"("productId");

-- CreateIndex
CREATE INDEX "ProductFitment_level_idx" ON "ProductFitment"("level");

-- CreateIndex
CREATE INDEX "ProductFitment_makeId_idx" ON "ProductFitment"("makeId");

-- CreateIndex
CREATE INDEX "ProductFitment_modelId_idx" ON "ProductFitment"("modelId");

-- CreateIndex
CREATE INDEX "ProductFitment_generationId_idx" ON "ProductFitment"("generationId");

-- CreateIndex
CREATE INDEX "ProductFitment_engineId_idx" ON "ProductFitment"("engineId");

-- CreateIndex
CREATE INDEX "ProductFitment_trimId_idx" ON "ProductFitment"("trimId");

-- CreateIndex
CREATE INDEX "ProductFitment_yearStart_yearEnd_idx" ON "ProductFitment"("yearStart", "yearEnd");

-- CreateIndex
CREATE INDEX "ProductFitment_isUniversal_idx" ON "ProductFitment"("isUniversal");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFitment_productId_level_makeId_modelId_generationId__key" ON "ProductFitment"("productId", "level", "makeId", "modelId", "generationId", "engineId", "trimId", "yearStart", "yearEnd");

-- CreateIndex
CREATE INDEX "VehicleEngine_generationId_idx" ON "VehicleEngine"("generationId");

-- CreateIndex
CREATE INDEX "VehicleEngine_engineCode_idx" ON "VehicleEngine"("engineCode");

-- CreateIndex
CREATE INDEX "VehicleEngine_fuelType_idx" ON "VehicleEngine"("fuelType");

-- CreateIndex
CREATE INDEX "VehicleEngine_isActive_idx" ON "VehicleEngine"("isActive");

-- CreateIndex
CREATE INDEX "VehicleGeneration_modelId_idx" ON "VehicleGeneration"("modelId");

-- CreateIndex
CREATE INDEX "VehicleGeneration_yearStart_yearEnd_idx" ON "VehicleGeneration"("yearStart", "yearEnd");

-- CreateIndex
CREATE INDEX "VehicleGeneration_isActive_idx" ON "VehicleGeneration"("isActive");

-- CreateIndex
CREATE INDEX "VehicleGeneration_chassisCode_idx" ON "VehicleGeneration"("chassisCode");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMake_slug_key" ON "VehicleMake"("slug");

-- CreateIndex
CREATE INDEX "VehicleMake_isActive_idx" ON "VehicleMake"("isActive");

-- CreateIndex
CREATE INDEX "VehicleModel_makeId_idx" ON "VehicleModel"("makeId");

-- CreateIndex
CREATE INDEX "VehicleModel_isActive_idx" ON "VehicleModel"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_makeId_slug_key" ON "VehicleModel"("makeId", "slug");

-- CreateIndex
CREATE INDEX "VehicleTrim_engineId_idx" ON "VehicleTrim"("engineId");

-- CreateIndex
CREATE INDEX "VehicleTrim_isActive_idx" ON "VehicleTrim"("isActive");

-- AddForeignKey
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "VehicleMake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleGeneration" ADD CONSTRAINT "VehicleGeneration_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleEngine" ADD CONSTRAINT "VehicleEngine_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "VehicleGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTrim" ADD CONSTRAINT "VehicleTrim_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "VehicleEngine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitmentIndex" ADD CONSTRAINT "FitmentIndex_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFitment" ADD CONSTRAINT "ProductFitment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFitment" ADD CONSTRAINT "ProductFitment_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "VehicleMake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFitment" ADD CONSTRAINT "ProductFitment_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFitment" ADD CONSTRAINT "ProductFitment_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "VehicleGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFitment" ADD CONSTRAINT "ProductFitment_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "VehicleEngine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFitment" ADD CONSTRAINT "ProductFitment_trimId_fkey" FOREIGN KEY ("trimId") REFERENCES "VehicleTrim"("id") ON DELETE SET NULL ON UPDATE CASCADE;
