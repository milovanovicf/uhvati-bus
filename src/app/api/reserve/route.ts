import prisma from '@/lib/prisma';
import { deleteSchema, reservationSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';
const { DateTime } = require('luxon');

export async function POST(req: NextRequest) {
  const body = await req.json();

  const parseResult = reservationSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return NextResponse.json({ errors }, { status: 400 });
  }

  const {
    fullName,
    email,
    seats: requestedSeatsCount,
    routeId,
    date,
    time,
  } = body;

  const formatedDate = DateTime.fromISO(`${date}T${time}`, {
    zone: 'utc',
  }).toJSDate();

  const trip = await prisma.trip.findFirst({
    where: {
      routeId: routeId,
      departure: formatedDate,
    },
    include: {
      reservations: true,
    },
  });

  if (!trip) {
    return NextResponse.json(
      { error: 'Ruta nije pronadjena' },
      { status: 404 }
    );
  }

  // Determine taken seats
  const takenSeats = new Set<number>();

  for (const reservation of trip.reservations) {
    const seats = reservation.seats;
    if (Array.isArray(seats)) {
      for (const seat of seats) {
        takenSeats.add(seat as number);
      }
    }
  }

  const availableSeatsCount = trip.seatsTotal - takenSeats.size;

  if (requestedSeatsCount > availableSeatsCount) {
    return NextResponse.json(
      { error: 'Nema slobodnih sedista na ovoj ruti.' },
      { status: 400 }
    );
  }

  const assignedSeats: number[] = [];
  let seatNumber = 1;
  while (assignedSeats.length < requestedSeatsCount) {
    if (!takenSeats.has(seatNumber)) {
      assignedSeats.push(seatNumber);
    }
    seatNumber++;
  }

  // Create reservation
  const reservation = await prisma.reservation.create({
    data: {
      fullName,
      email,
      seats: assignedSeats,
      tripId: trip.id,
    },
  });

  return NextResponse.json({
    message: 'Rezervacija uspesna',
    reservation,
  });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const parseResult = deleteSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid reservation ID' },
      { status: 400 }
    );
  }

  const { id } = parseResult.data;

  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: 'Reservation not found' },
      { status: 404 }
    );
  }

  const deleted = await prisma.reservation.delete({ where: { id } });

  return NextResponse.json({
    message: 'Reservation canceled',
    reservation: deleted,
  });
}
