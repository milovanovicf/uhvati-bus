ALTER TABLE "Reservation" ADD COLUMN "bookingRef" TEXT;
CREATE UNIQUE INDEX "Reservation_bookingRef_key" ON "Reservation"("bookingRef");
