import prisma from '@/lib/prisma';
import { log } from 'console';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const fromId = searchParams.get('fromId');
  const toId = searchParams.get('toId');
  const date = searchParams.get('date'); // Expected format: 'YYYY-MM-DD'
  console.log(fromId, toId, date);

  // Basic validation
  if (!fromId || !toId || !date) {
    return NextResponse.json(
      { error: 'Missing fromId, toId, or date in query params' },
      { status: 400 }
    );
  }

  // Build date range (00:00 to 23:59 of the selected day)
  const startDate = new Date(date);
  const endDate = new Date(new Date(date).setHours(23, 59, 59, 999));

  const trips = await prisma.trip.findMany({
    where: {
      route: {
        fromId: Number(fromId),
        toId: Number(toId),
      },
      departure: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      company: true,
      route: {
        include: {
          from: true,
          to: true,
        },
      },
    },
    orderBy: {
      departure: 'asc',
    },
  });

  return NextResponse.json(trips);
}
