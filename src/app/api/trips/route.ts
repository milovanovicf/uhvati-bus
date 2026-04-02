import { prisma } from '@/app/utils/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const fromId = searchParams.get('fromId');
  const toId = searchParams.get('toId');
  const date = searchParams.get('date');
  const time = searchParams.get('time');

  if (!fromId || !toId || !date) {
    return NextResponse.json(
      { error: 'Missing fromId, toId, or date in query params' },
      { status: 400 }
    );
  }

  try {
    // Create date range for the selected date
    const startDate = new Date(date);
    const endDate = new Date(new Date(date).setHours(23, 59, 59, 999));

    // If time is provided, filter trips after the selected time
    let departureFilter: any = {
      gte: startDate,
      lte: endDate,
    };

    if (time) {
      const [hours, minutes] = time.split(':');
      const targetTime = new Date(date);
      targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Only show trips that depart after the selected time
      departureFilter = {
        gte: targetTime,
        lte: endDate,
      };
    }

    const trips = await prisma.trip.findMany({
      where: {
        route: {
          fromId: Number(fromId),
          toId: Number(toId),
        },
        departure: departureFilter,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        route: {
          include: {
            from: true,
            to: true,
          },
        },
        reservations: {
          select: {
            id: true,
            seats: true,
          },
        },
      },
      orderBy: {
        departure: 'asc',
      },
    });

    // Calculate available seats for each trip
    const tripsWithAvailability = trips.map((trip) => {
      const takenSeats = new Set<number>();
      for (const reservation of trip.reservations) {
        if (Array.isArray(reservation.seats)) {
          for (const seat of reservation.seats) {
            takenSeats.add(seat as number);
          }
        }
      }

      const availableSeats = trip.seatsTotal - takenSeats.size;
      const availableSeatNumbers = [];

      for (let i = 1; i <= trip.seatsTotal; i++) {
        if (!takenSeats.has(i)) {
          availableSeatNumbers.push(i);
        }
      }

      return {
        ...trip,
        availableSeats,
        availableSeatNumbers,
        takenSeats: Array.from(takenSeats),
      };
    });

    return NextResponse.json(tripsWithAvailability);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}
