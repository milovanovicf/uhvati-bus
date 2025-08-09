/*
  Warnings:

  - You are about to drop the column `name` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `surname` on the `Reservation` table. All the data in the column will be lost.
  - Added the required column `fullName` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "name",
DROP COLUMN "phone",
DROP COLUMN "surname",
ADD COLUMN     "fullName" TEXT NOT NULL;
