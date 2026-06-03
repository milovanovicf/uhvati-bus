import { verifyReservationToken } from '@/lib/reservationToken';
import { prisma } from '@/app/utils/db';
import ReturnBookingClient from './ReturnBookingClient';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ReturnBookingPage({ params }: Props) {
  const { token } = await params;

  const reservationId = verifyReservationToken(token);
  if (!reservationId) {
    return <ReturnBookingClient token={token} outbound={null} existingReturn={null} />;
  }

  const outbound = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      bookingRef: true,
      fullName: true,
      email: true,
      seats: true,
      trip: {
        select: {
          route: {
            select: {
              fromId: true,
              toId: true,
              from: { select: { id: true, name: true } },
              to: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!outbound || !outbound.bookingRef) {
    return <ReturnBookingClient token={token} outbound={null} existingReturn={null} />;
  }

  const existingReturn = await prisma.reservation.findFirst({
    where: { returnOf: outbound.bookingRef },
    select: {
      id: true,
      bookingRef: true,
      seats: true,
      trip: {
        select: {
          id: true,
          departure: true,
          arrival: true,
          seatsTotal: true,
          route: {
            select: {
              from: { select: { name: true } },
              to: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const seatsCount = Array.isArray(outbound.seats) ? outbound.seats.length : 1;

  return (
    <ReturnBookingClient
      token={token}
      outbound={{
        bookingRef: outbound.bookingRef,
        fullName: outbound.fullName,
        email: outbound.email,
        seats: seatsCount,
        returnFromId: outbound.trip.route.toId.toString(),
        returnToId: outbound.trip.route.fromId.toString(),
        returnFromName: outbound.trip.route.to.name,
        returnToName: outbound.trip.route.from.name,
      }}
      existingReturn={existingReturn ? {
        id: existingReturn.id,
        bookingRef: existingReturn.bookingRef,
        seats: Array.isArray(existingReturn.seats) ? existingReturn.seats.length : 1,
        departure: existingReturn.trip.departure,
        arrival: existingReturn.trip.arrival,
        tripId: existingReturn.trip.id,
        seatsTotal: existingReturn.trip.seatsTotal,
        fromName: existingReturn.trip.route.from.name,
        toName: existingReturn.trip.route.to.name,
      } : null}
    />
  );
}
