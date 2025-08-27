/*
  Warnings:

  - A unique constraint covering the columns `[companyId,routeId,departure]` on the table `Trip` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Trip_departure_key";

-- CreateIndex
CREATE UNIQUE INDEX "Trip_companyId_routeId_departure_key" ON "Trip"("companyId", "routeId", "departure");
