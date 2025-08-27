import prisma from '@/lib/prisma';
import { deleteSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFromToken } from '@/app/api/lib/auth';

export async function GET() {
  const company = await getCompanyFromToken();
  if (!company) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trips = await prisma.trip.findMany({
    where: { company },
    include: {
      route: {
        select: {
          from: { select: { name: true } },
          to: { select: { name: true } },
        },
      },
    },
    orderBy: { departure: 'asc' },
  });

  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const company = await getCompanyFromToken();
  if (!company) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();

  let route = await prisma.route.findUnique({
    where: {
      fromId_toId_companyId: {
        companyId: company!.id,
        fromId: data.fromId,
        toId: data.toId,
      },
    },
  });

  if (!route) {
    route = await prisma.route.create({
      data: {
        companyId: company!.id,
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
  console.log(trip);

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
