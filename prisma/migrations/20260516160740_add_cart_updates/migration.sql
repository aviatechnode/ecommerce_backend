-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('STANDARD', 'EXPRESS', 'SAME_DAY', 'PICKUP_STATION');

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "deliveryLgaId" TEXT,
ADD COLUMN     "deliveryStateId" TEXT,
ADD COLUMN     "estimatedDeliveryFee" DECIMAL(12,2),
ADD COLUMN     "grandTotal" DECIMAL(12,2),
ADD COLUMN     "shippingZoneId" TEXT,
ADD COLUMN     "subtotal" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "_OrderToShipment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrderToShipment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_OrderToShipment_B_index" ON "_OrderToShipment"("B");

-- CreateIndex
CREATE INDEX "Cart_deliveryStateId_idx" ON "Cart"("deliveryStateId");

-- CreateIndex
CREATE INDEX "Cart_deliveryLgaId_idx" ON "Cart"("deliveryLgaId");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_deliveryStateId_fkey" FOREIGN KEY ("deliveryStateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_deliveryLgaId_fkey" FOREIGN KEY ("deliveryLgaId") REFERENCES "LGA"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_shippingZoneId_fkey" FOREIGN KEY ("shippingZoneId") REFERENCES "ShippingZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderToShipment" ADD CONSTRAINT "_OrderToShipment_A_fkey" FOREIGN KEY ("A") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderToShipment" ADD CONSTRAINT "_OrderToShipment_B_fkey" FOREIGN KEY ("B") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
