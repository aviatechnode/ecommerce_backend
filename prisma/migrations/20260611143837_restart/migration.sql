/*
  Warnings:

  - The `fuelType` column on the `VehicleEngine` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `aspiration` column on the `VehicleEngine` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `drivetrain` column on the `VehicleEngine` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `transmissionType` column on the `VehicleEngine` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bodyType` column on the `VehicleTrim` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'PLUG_IN_HYBRID', 'ELECTRIC', 'LPG', 'CNG');

-- CreateEnum
CREATE TYPE "AspirationType" AS ENUM ('NA', 'TURBO', 'TWIN_TURBO', 'SUPERCHARGED');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT', 'DCT');

-- CreateEnum
CREATE TYPE "DriveType" AS ENUM ('FWD', 'RWD', 'AWD', 'FOUR_WD');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('SEDAN', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'SUV', 'CROSSOVER', 'PICKUP', 'WAGON', 'VAN', 'MINIVAN', 'MPV');

-- AlterTable
ALTER TABLE "VehicleEngine" DROP COLUMN "fuelType",
ADD COLUMN     "fuelType" "FuelType",
DROP COLUMN "aspiration",
ADD COLUMN     "aspiration" "AspirationType",
DROP COLUMN "drivetrain",
ADD COLUMN     "drivetrain" "DriveType",
DROP COLUMN "transmissionType",
ADD COLUMN     "transmissionType" "TransmissionType";

-- AlterTable
ALTER TABLE "VehicleTrim" DROP COLUMN "bodyType",
ADD COLUMN     "bodyType" "BodyType";

-- CreateTable
CREATE TABLE "OEMReference" (
    "id" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OEMReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrossReference" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrossReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFitmentOEM" (
    "id" TEXT NOT NULL,
    "productFitmentId" TEXT NOT NULL,
    "oemReferenceId" TEXT NOT NULL,

    CONSTRAINT "ProductFitmentOEM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFitmentCrossReference" (
    "id" TEXT NOT NULL,
    "productFitmentId" TEXT NOT NULL,
    "crossReferenceId" TEXT NOT NULL,

    CONSTRAINT "ProductFitmentCrossReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OEMReference_partNumber_idx" ON "OEMReference"("partNumber");

-- CreateIndex
CREATE INDEX "OEMReference_manufacturer_idx" ON "OEMReference"("manufacturer");

-- CreateIndex
CREATE UNIQUE INDEX "OEMReference_manufacturer_partNumber_key" ON "OEMReference"("manufacturer", "partNumber");

-- CreateIndex
CREATE INDEX "CrossReference_partNumber_idx" ON "CrossReference"("partNumber");

-- CreateIndex
CREATE INDEX "CrossReference_brand_idx" ON "CrossReference"("brand");

-- CreateIndex
CREATE UNIQUE INDEX "CrossReference_brand_partNumber_key" ON "CrossReference"("brand", "partNumber");

-- CreateIndex
CREATE INDEX "ProductFitmentOEM_productFitmentId_idx" ON "ProductFitmentOEM"("productFitmentId");

-- CreateIndex
CREATE INDEX "ProductFitmentOEM_oemReferenceId_idx" ON "ProductFitmentOEM"("oemReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFitmentOEM_productFitmentId_oemReferenceId_key" ON "ProductFitmentOEM"("productFitmentId", "oemReferenceId");

-- CreateIndex
CREATE INDEX "ProductFitmentCrossReference_productFitmentId_idx" ON "ProductFitmentCrossReference"("productFitmentId");

-- CreateIndex
CREATE INDEX "ProductFitmentCrossReference_crossReferenceId_idx" ON "ProductFitmentCrossReference"("crossReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFitmentCrossReference_productFitmentId_crossReferenc_key" ON "ProductFitmentCrossReference"("productFitmentId", "crossReferenceId");

-- CreateIndex
CREATE INDEX "ProductFitment_isVerified_idx" ON "ProductFitment"("isVerified");

-- CreateIndex
CREATE INDEX "VehicleEngine_fuelType_idx" ON "VehicleEngine"("fuelType");

-- AddForeignKey
ALTER TABLE "ProductFitmentOEM" ADD CONSTRAINT "ProductFitmentOEM_productFitmentId_fkey" FOREIGN KEY ("productFitmentId") REFERENCES "ProductFitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFitmentOEM" ADD CONSTRAINT "ProductFitmentOEM_oemReferenceId_fkey" FOREIGN KEY ("oemReferenceId") REFERENCES "OEMReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFitmentCrossReference" ADD CONSTRAINT "ProductFitmentCrossReference_productFitmentId_fkey" FOREIGN KEY ("productFitmentId") REFERENCES "ProductFitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFitmentCrossReference" ADD CONSTRAINT "ProductFitmentCrossReference_crossReferenceId_fkey" FOREIGN KEY ("crossReferenceId") REFERENCES "CrossReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;
