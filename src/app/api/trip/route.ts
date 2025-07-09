import prisma from '@/lib/prisma';
import { deleteSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const trips = await prisma.trip.findMany({
    include: {
      company: true,
      route: {
        include: {
          from: true,
          to: true,
        },
      },
    },
  });
  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  // Expect data.fromId and data.toId (city IDs)
  // Expect data.departure and data.arrival ISO date strings or timestamps

  // Find or create Route for fromId and toId
  let route = await prisma.route.findUnique({
    where: {
      fromId_toId: {
        fromId: data.fromId,
        toId: data.toId,
      },
    },
  });

  if (!route) {
    route = await prisma.route.create({
      data: {
        fromId: data.fromId,
        toId: data.toId,
      },
    });
  }

  const trip = await prisma.trip.create({
    data: {
      routeId: route.id,
      companyId: data.companyId,
      departure: new Date(data.departure),
      arrival: new Date(data.arrival),
      seatsTotal: data.seatsTotal,
    },
  });

  return NextResponse.json(trip);
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const parseResult = deleteSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });
  }

  const { id } = parseResult.data;

  const existing = await prisma.trip.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const deleted = await prisma.trip.delete({ where: { id } });

  return NextResponse.json({
    message: 'Trip removed',
    trip: deleted,
  });
}
