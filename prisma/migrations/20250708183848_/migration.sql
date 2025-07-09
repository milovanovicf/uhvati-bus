/*
  Warnings:

  - You are about to drop the column `date` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `from` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `to` on the `Trip` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,departure]` on the table `Trip` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `arrival` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departure` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `routeId` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');

-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "date",
DROP COLUMN "from",
DROP COLUMN "to",
ADD COLUMN     "arrival" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "departure" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "routeId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Route" (
    "id" SERIAL NOT NULL,
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,
    "distance" INTEGER,
    "duration" INTEGER,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "routeId" INTEGER NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "time" TEXT NOT NULL,
    "seatsTotal" INTEGER NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Route_fromId_toId_key" ON "Route"("fromId", "toId");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_companyId_departure_key" ON "Trip"("companyId", "departure");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_toId_fkey" FOREIGN KEY ("toId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
