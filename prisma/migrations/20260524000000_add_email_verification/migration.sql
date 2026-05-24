ALTER TABLE "Company" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN "verificationCode" TEXT;
ALTER TABLE "Company" ADD COLUMN "verificationExpiry" TIMESTAMP(3);
