/*
  Warnings:

  - A unique constraint covering the columns `[google_place_id]` on the table `Pharmacy` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Pharmacy" ADD COLUMN     "google_place_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Pharmacy_google_place_id_key" ON "Pharmacy"("google_place_id");
