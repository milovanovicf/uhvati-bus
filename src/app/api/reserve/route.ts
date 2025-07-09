import prisma from '@/lib/prisma';
import { deleteSchema, reservationSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';

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

  const { name, email, phone, seats: requestedSeatsCount, tripId } = body;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { reservations: true },
  });

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Collect all taken seat numbers for this trip
  const takenSeats = new Set<number>();
  for (const reservation of trip.reservations) {
    for (const seat of reservation.seats) {
      takenSeats.add(seat);
    }
  }

  const availableSeatsCount = trip.seatsTotal - takenSeats.size;

  if (requestedSeatsCount > availableSeatsCount) {
    return NextResponse.json(
      { error: 'Not enough seats available' },
      { status: 400 }
    );
  }

  // Assign actual seat numbers
  const assignedSeats: number[] = [];
  let seatNumber = 1;
  while (assignedSeats.length < requestedSeatsCount) {
    if (!takenSeats.has(seatNumber)) {
      assignedSeats.push(seatNumber);
    }
    seatNumber++;
  }

  // Create the reservation with assigned seats array
  const reservation = await prisma.reservation.create({
    data: {
      name,
      email,
      phone,
      seats: assignedSeats,
      tripId,
    },
  });

  return NextResponse.json({
    message: 'Reservation successful',
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
