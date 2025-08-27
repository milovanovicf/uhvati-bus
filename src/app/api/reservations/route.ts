import prisma from '@/lib/prisma';
import { deleteSchema, reservationSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFromToken } from '../lib/auth';
const { DateTime } = require('luxon');

export async function POST(req: NextRequest) {
  const body = await req.json();

  // const parseResult = reservationSchema.safeParse(body);
  // if (!parseResult.success) {
  //   const errors = parseResult.error.errors.map((err) => ({
  //     field: err.path.join('.'),
  //     message: err.message,
  //   }));
  //   return NextResponse.json({ errors }, { status: 400 });
  // }

  const {
    fullName,
    email,
    seats: requestedSeatsCount,
    fromCityId,
    toCityId,
    date,
    time,
  } = body;

  const departureDate = DateTime.fromISO(`${date}T${time}`, {
    zone: 'local', // interpret what user entered as their *local* time
  }).toUTC();

  const route = await prisma.route.findFirst({
    where: {
      fromId: fromCityId,
      toId: toCityId,
    },
  });

  if (!route) {
    return NextResponse.json(
      { error: 'Ruta nije pronađena između odabranih gradova.' },
      { status: 404 }
    );
  }

  const trip = await prisma.trip.findFirst({
    where: {
      routeId: route.id,
      departure: departureDate.toJSDate(),
    },
    include: {
      reservations: true,
    },
  });

  if (!trip) {
    return NextResponse.json(
      { error: 'Nema polaska za ovu rutu u odabrano vreme.' },
      { status: 404 }
    );
  }

  const takenSeats = new Set<number>();
  for (const reservation of trip.reservations) {
    if (Array.isArray(reservation.seats)) {
      for (const seat of reservation.seats) {
        takenSeats.add(seat as number);
      }
    }
  }

  const availableSeatsCount = trip.seatsTotal - takenSeats.size;

  if (requestedSeatsCount > availableSeatsCount) {
    return NextResponse.json(
      { error: 'Nema slobodnih sedišta na ovoj ruti.' },
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

  const company = await prisma.company.findFirst({
    where: { id: trip.companyId },
  });

  if (!company) {
    return NextResponse.json(
      { error: 'Ne postoji kompanija za odabrani polazak.' },
      { status: 500 }
    );
  }

  const reservation = await prisma.reservation.create({
    data: {
      fullName,
      companyId: company.id,
      email,
      seats: assignedSeats,
      tripId: trip.id,
    },
  });

  return NextResponse.json({
    message: 'Rezervacija uspešna',
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

export async function GET() {
  const company = await getCompanyFromToken();
  if (!company) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reservations = await prisma.reservation.findMany({
    where: { company },
    include: {
      trip: {
        include: {
          route: {
            include: {
              from: true,
              to: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(reservations);
}
