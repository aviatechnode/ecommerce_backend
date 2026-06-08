/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ShippingZone` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShippingZone_name_key" ON "ShippingZone"("name");
