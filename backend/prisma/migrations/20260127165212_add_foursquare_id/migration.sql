/*
  Warnings:

  - A unique constraint covering the columns `[foursquare_id]` on the table `Pharmacy` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Pharmacy" ADD COLUMN     "foursquare_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Pharmacy_foursquare_id_key" ON "Pharmacy"("foursquare_id");
