/*
  Warnings:

  - Made the column `street` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `street` on table `OrderAddress` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Address" ALTER COLUMN "street" SET NOT NULL,
ALTER COLUMN "landmark" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrderAddress" ALTER COLUMN "street" SET NOT NULL,
ALTER COLUMN "landmark" DROP NOT NULL;
