/*
  Warnings:

  - You are about to drop the column `country` on the `OrderAddress` table. All the data in the column will be lost.
  - Added the required column `fullAddress` to the `OrderAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `landmark` to the `OrderAddress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderAddress" DROP COLUMN "country",
ADD COLUMN     "area" TEXT,
ADD COLUMN     "fullAddress" TEXT NOT NULL,
ADD COLUMN     "landmark" TEXT NOT NULL,
ALTER COLUMN "street" DROP NOT NULL;
