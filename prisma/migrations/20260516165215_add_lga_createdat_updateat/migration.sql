/*
  Warnings:

  - You are about to drop the `_OrderToShipment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `shippingMethod` to the `Shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ShippingZoneLGA` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_OrderToShipment" DROP CONSTRAINT "_OrderToShipment_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrderToShipment" DROP CONSTRAINT "_OrderToShipment_B_fkey";

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "pickupStationId" TEXT,
ADD COLUMN     "shippingMethod" "ShippingMethod" NOT NULL;

-- AlterTable
ALTER TABLE "ShippingZoneLGA" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "_OrderToShipment";

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
