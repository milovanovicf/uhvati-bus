import { verifyReservationToken } from '@/lib/reservationToken';
import { prisma } from '@/app/utils/db';
import ReservationView from './ReservationView';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ReservationPage({ params }: Props) {
  const { token } = await params;

  const reservationId = verifyReservationToken(token);

  if (!reservationId) {
    return <ReservationView reservation={null} invalidReason="invalid_token" token={token} />;
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      bookingRef: true,
      trip: {
        select: {
          departure: true,
          route: {
            select: {
              fromId: true,
              toId: true,
              from: { select: { name: true } },
              to: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!reservation) {
    return <ReservationView reservation={null} invalidReason="not_found" token={token} />;
  }

  return <ReservationView reservation={reservation} token={token} />;
}
