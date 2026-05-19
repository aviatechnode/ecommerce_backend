/*
  Warnings:

  - Added the required column `courierId` to the `PickupStation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PickupStation" ADD COLUMN     "courierId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PickupStation" ADD CONSTRAINT "PickupStation_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
