/*
  Warnings:

  - A unique constraint covering the columns `[trackingNo]` on the table `Shipment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `perKmFee` to the `ShippingRate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ShippingRate" DROP CONSTRAINT "ShippingRate_courierId_fkey";

-- DropForeignKey
ALTER TABLE "ShippingZone" DROP CONSTRAINT "ShippingZone_courierId_fkey";

-- AlterTable
ALTER TABLE "Courier" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "length" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "width" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ShippingRate" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "perKmFee" DECIMAL(12,2) NOT NULL;

-- CreateTable
CREATE TABLE "StateDistance" (
    "id" TEXT NOT NULL,
    "originState" "NigerianState" NOT NULL,
    "destinationState" "NigerianState" NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StateDistance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StateDistance_originState_destinationState_key" ON "StateDistance"("originState", "destinationState");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_trackingNo_key" ON "Shipment"("trackingNo");

-- CreateIndex
CREATE INDEX "Shipment_trackingNo_idx" ON "Shipment"("trackingNo");

-- CreateIndex
CREATE INDEX "ShippingRate_originState_destinationState_idx" ON "ShippingRate"("originState", "destinationState");

-- CreateIndex
CREATE INDEX "ShippingRate_courierId_idx" ON "ShippingRate"("courierId");

-- CreateIndex
CREATE INDEX "ShippingZone_state_idx" ON "ShippingZone"("state");

-- AddForeignKey
ALTER TABLE "ShippingRate" ADD CONSTRAINT "ShippingRate_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingZone" ADD CONSTRAINT "ShippingZone_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
