import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const trips = await prisma.trip.findMany({
    include: { company: true },
  });
  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  const trip = await prisma.trip.create({
    data: {
      from: data.from,
      to: data.to,
      date: new Date(data.date),
      seatsTotal: data.seatsTotal,
      companyId: data.companyId,
    },
  });

  return NextResponse.json(trip);
}
