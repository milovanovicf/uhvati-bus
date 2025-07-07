import { Reservation } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { name, email, phone, seats, tripId } = await req.json();

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { reservations: true },
  });

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const reserevedSeats = trip.reservations.reduce(
    (sum: number, r: Reservation) => sum + r.seats,
    0
  );
  const availableSeats = trip.seatsTotal - reserevedSeats;

  if (seats > availableSeats) {
    return NextResponse.json(
      { error: 'Not enough seats available' },
      { status: 400 }
    );
  }

  const reservation = await prisma.reservation.create({
    data: {
      name,
      email,
      phone,
      seats,
      tripId,
    },
  });

  return NextResponse.json({
    message: 'Reservation successful',
    reservation,
  });
}
