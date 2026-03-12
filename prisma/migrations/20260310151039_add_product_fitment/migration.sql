/*
  Warnings:

  - A unique constraint covering the columns `[productId,trimId]` on the table `ProductFitment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProductFitment_productId_trimId_key" ON "ProductFitment"("productId", "trimId");
