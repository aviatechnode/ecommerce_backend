/*
  Warnings:

  - A unique constraint covering the columns `[productId,make,model,year]` on the table `FitmentIndex` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "FitmentIndex_make_model_year_idx";

-- CreateIndex
CREATE UNIQUE INDEX "FitmentIndex_productId_make_model_year_key" ON "FitmentIndex"("productId", "make", "model", "year");
