/*
  Warnings:

  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Schedule" DROP CONSTRAINT "Schedule_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Schedule" DROP CONSTRAINT "Schedule_routeId_fkey";

-- DropTable
DROP TABLE "public"."Schedule";

-- DropEnum
DROP TYPE "public"."Weekday";
