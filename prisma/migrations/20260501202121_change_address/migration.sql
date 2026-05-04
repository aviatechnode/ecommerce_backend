/*
  Warnings:

  - You are about to drop the column `country` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Address` table. All the data in the column will be lost.
  - Added the required column `fullAddress` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Made the column `landmark` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isDefault` on table `Address` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "country",
DROP COLUMN "postalCode",
DROP COLUMN "type",
ADD COLUMN     "area" TEXT,
ADD COLUMN     "fullAddress" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "street" DROP NOT NULL,
ALTER COLUMN "landmark" SET NOT NULL,
ALTER COLUMN "isDefault" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "Address_state_lga_idx" ON "Address"("state", "lga");
