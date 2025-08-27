/*
  Warnings:

  - A unique constraint covering the columns `[fromId,toId,companyId]` on the table `Route` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `Route` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Route_fromId_toId_key";

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Route_fromId_toId_companyId_key" ON "Route"("fromId", "toId", "companyId");

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
