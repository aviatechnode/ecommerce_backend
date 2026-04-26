/*
  Warnings:

  - Made the column `csrfHash` on table `RefreshToken` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "csrfHash" SET NOT NULL;
