/*
  Warnings:

  - Added the required column `surname` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `seats` on the `Reservation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "surname" TEXT NOT NULL,
DROP COLUMN "seats",
ADD COLUMN     "seats" JSONB NOT NULL;
