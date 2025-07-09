import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const trip = await prisma.trip.findUnique({
    where: { id: Number(params.id) },
    include: {
      company: true,
      route: { include: { from: true, to: true } },
    },
  });

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  return NextResponse.json(trip);
}
