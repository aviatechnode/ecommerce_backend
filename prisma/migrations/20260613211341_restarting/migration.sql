/*
  Warnings:

  - A unique constraint covering the columns `[type,level]` on the table `FitmentTypeRule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FitmentTypeRule_type_level_key" ON "FitmentTypeRule"("type", "level");
