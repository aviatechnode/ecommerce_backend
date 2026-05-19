/*
  Warnings:

  - Added the required column `updatedAt` to the `PickupStation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PickupStation" ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "openingHours" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "PickupStation_stateId_idx" ON "PickupStation"("stateId");

-- CreateIndex
CREATE INDEX "PickupStation_lgaId_idx" ON "PickupStation"("lgaId");

-- CreateIndex
CREATE INDEX "PickupStation_isActive_idx" ON "PickupStation"("isActive");

-- CreateIndex
CREATE INDEX "PickupStation_stateId_lgaId_idx" ON "PickupStation"("stateId", "lgaId");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_pickupStationId_fkey" FOREIGN KEY ("pickupStationId") REFERENCES "PickupStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupStation" ADD CONSTRAINT "PickupStation_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupStation" ADD CONSTRAINT "PickupStation_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "LGA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
