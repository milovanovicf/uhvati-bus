'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from './utils/db';
import { Reservation } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendBookingConfirmation } from '@/lib/email';
import { signReservationToken, verifyReservationToken } from '@/lib/reservationToken';

type ReservationState = {
  success: boolean;
  error?: string;
  fieldErrors?: { [key: string]: string };
  reservation?: Reservation;
};

function generateBookingRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let ref = 'BUS-';
  for (const byte of bytes) {
    ref += chars[byte % chars.length];
  }
  return ref;
}

export async function handleReservationCreate(
  _prevState: ReservationState,
  formData: FormData
): Promise<ReservationState> {
  try {
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const requestedSeatsCount = Number(formData.get('seats'));
    const tripId = formData.get('tripId') as string;

    if (!fullName || !email || !requestedSeatsCount || !tripId) {
      return {
        success: false,
        error: 'Sva polja su obavezna.',
      };
    }

    const trip = await prisma.trip.findUnique({
      where: {
        id: Number(tripId),
      },
      include: {
        reservations: true,
        route: {
          include: {
            from: true,
            to: true,
          },
        },
      },
    });

    if (!trip) {
      return {
        error: 'Odabrani polazak nije pronađen.',
        success: false,
      };
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
      return {
        success: false,
        error: 'Nema slobodnih sedišta na ovoj ruti.',
      };
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
      return {
        success: false,
        error: 'Ne postoji kompanija za odabrani polazak.',
      };
    }

    const bookingRef = generateBookingRef();

    const reservation = await prisma.reservation.create({
      data: {
        bookingRef,
        fullName,
        companyId: company.id,
        email,
        seats: assignedSeats,
        tripId: trip.id,
      },
    });

    const reservationToken = signReservationToken(reservation.id);
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? vercelUrl ?? 'http://localhost:3000';

    await sendBookingConfirmation({
      to: email,
      fullName,
      outbound: {
        bookingRef,
        fromCity: trip.route.from.name,
        toCity: trip.route.to.name,
        departure: trip.departure,
        arrival: trip.arrival,
        companyName: company.name,
        seats: assignedSeats,
        viewCancelUrl: `${baseUrl}/rezervacija/${reservationToken}`,
      },
      returnBookingUrl: `${baseUrl}/povratna-karta/${reservationToken}`,
    });

    return {
      success: true,
      reservation,
    };
  } catch (error) {
    console.error('Reservation creation error:', error);
    return {
      success: false,
      error: 'Došlo je do greške prilikom kreiranja rezervacije.',
    };
  }
}

export async function handleReservationDelete(
  id: number
): Promise<ReservationState> {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return {
        error: 'Rezervacija nije pronađena',
        success: false,
      };
    }

    await prisma.reservation.delete({ where: { id } });

    revalidatePath('/company');

    return {
      success: true,
      reservation,
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: 'Greška prilikom brisanja rezervacije',
    };
  }
}

export async function getCurrentCompany() {
  const token = (await cookies()).get('token')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
    id: number;
  };

  const company = await prisma.company.findFirst({
    where: { id: payload.id },
    include: {
      trips: {
        include: {
          route: {
            select: {
              id: true,
              from: { select: { name: true } },
              to: { select: { name: true } },
            },
          },
          reservations: true,
        },
        orderBy: { departure: 'desc' },
      },
    },
  });

  if (!company) {
    throw new Error('Company not found for user');
  }

  if (company.status === 'PENDING') {
    throw new Error('PENDING_APPROVAL');
  }

  if (company.status === 'DISABLED') {
    throw new Error('ACCOUNT_DISABLED');
  }

  return company;
}

export async function getCompanyTrips() {
  const company = await getCurrentCompany();

  const trips = await prisma.trip.findMany({
    where: { companyId: company.id },
    include: {
      route: {
        select: {
          id: true,
          from: { select: { id: true, name: true } },
          to: { select: { id: true, name: true } },
        },
      },
      reservations: {
        select: { id: true, fullName: true, email: true, seats: true },
      },
    },
    orderBy: { departure: 'desc' },
  });

  return trips.map((trip) => {
    const seatsReserved = trip.reservations.reduce((sum, r) => {
      if (Array.isArray(r.seats)) {
        return sum + r.seats.length;
      }
      return sum;
    }, 0);

    return {
      ...trip,
      seatsAvailable: trip.seatsTotal - seatsReserved,
    };
  });
}

export async function getCompanyRoutes() {
  const company = await getCurrentCompany();

  const routes = await prisma.route.findMany({
    where: {
      companyId: company.id,
    },
    include: {
      from: { select: { name: true } },
      to: { select: { name: true } },
    },
  });

  return routes;
}

export async function createTrip(formData: FormData) {
  const company = await getCurrentCompany();

  const fromId = formData.get('fromId') as string;
  const toId = formData.get('toId') as string;
  const departure = formData.get('departure') as string;
  const arrival = formData.get('arrival') as string;
  const seatsTotal = parseInt(formData.get('seatsTotal') as string);

  if (!fromId || !toId || !departure || !arrival || !seatsTotal) {
    throw new Error('Missing required fields');
  }

  let route = await prisma.route.findUnique({
    where: {
      fromId_toId_companyId: {
        companyId: company!.id,
        fromId: Number(fromId),
        toId: Number(toId),
      },
    },
  });

  if (!route) {
    route = await prisma.route.create({
      data: {
        companyId: company!.id,
        fromId: Number(fromId),
        toId: Number(toId),
      },
    });
  }

  const trip = await prisma.trip.create({
    data: {
      routeId: route.id,
      companyId: company!.id,
      departure: new Date(departure),
      arrival: new Date(arrival),
      seatsTotal: seatsTotal,
    },
  });

  revalidatePath('/company');
  return trip;
}

export async function updateTripTimes(
  tripId: number,
  departure: string,
  arrival: string,
) {
  const company = await getCurrentCompany();
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, companyId: company.id },
  });
  if (!trip) throw new Error('Trip not found or unauthorized');
  await prisma.trip.update({
    where: { id: tripId },
    data: { departure: new Date(departure), arrival: new Date(arrival) },
  });
  revalidatePath('/company');
}

export async function updateRouteSeats(routeId: number, seatsTotal: number) {
  const company = await getCurrentCompany();
  const route = await prisma.route.findFirst({ where: { id: routeId, companyId: company.id } });
  if (!route) throw new Error('Ruta nije pronađena.');
  await prisma.trip.updateMany({
    where: { routeId, companyId: company.id },
    data: { seatsTotal },
  });
  revalidatePath('/company');
}

export async function deleteTrip(tripId: number) {
  const company = await getCurrentCompany();

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      companyId: company.id,
    },
  });

  if (!trip) {
    throw new Error('Trip not found or unauthorized');
  }

  await prisma.trip.delete({
    where: { id: tripId },
  });

  revalidatePath('/company');
}

export async function deleteRoute(routeId: number) {
  const company = await getCurrentCompany();

  const route = await prisma.route.findFirst({
    where: { id: routeId, companyId: company.id },
    include: { trips: { select: { id: true } } },
  });

  if (!route) {
    throw new Error('Ruta nije pronađena ili nemate dozvolu');
  }

  const tripIds = route.trips.map((t) => t.id);

  await prisma.$transaction([
    prisma.reservation.deleteMany({ where: { tripId: { in: tripIds } } }),
    prisma.trip.deleteMany({ where: { routeId } }),
    prisma.route.delete({ where: { id: routeId } }),
  ]);

  revalidatePath('/company');
}

export async function updateTrip(tripId: number, formData: FormData) {
  const company = await getCurrentCompany();

  const existingTrip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      companyId: company.id,
    },
  });

  if (!existingTrip) {
    throw new Error('Trip not found or unauthorized');
  }

  const departure = formData.get('departure') as string;
  const arrival = formData.get('arrival') as string;
  const seatsTotal = parseInt(formData.get('seatsTotal') as string);

  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...(departure && { departure: new Date(departure) }),
      ...(arrival && { arrival: new Date(arrival) }),
      ...(seatsTotal && {
        seatsTotal,
      }),
    },
  });

  revalidatePath('/company');
  return trip;
}

interface TripData {
  fromId: number;
  toId: number;
  departure: string;
  arrival: string;
  seatsTotal: number;
}

export async function createMultipleTrips(tripsData: TripData[]) {
  const company = await getCurrentCompany();

  if (!tripsData || tripsData.length === 0) {
    throw new Error('No trip data provided');
  }

  // Validate all trips have the same route
  const firstTrip = tripsData[0];
  const allSameRoute = tripsData.every(
    (trip) => trip.fromId === firstTrip.fromId && trip.toId === firstTrip.toId
  );

  if (!allSameRoute) {
    throw new Error('All trips must have the same route');
  }

  // Find or create route
  let route = await prisma.route.findUnique({
    where: {
      fromId_toId_companyId: {
        companyId: company.id,
        fromId: firstTrip.fromId,
        toId: firstTrip.toId,
      },
    },
  });

  if (!route) {
    route = await prisma.route.create({
      data: {
        companyId: company.id,
        fromId: firstTrip.fromId,
        toId: firstTrip.toId,
      },
    });
  }

  // Check for overlapping trips before creating any
  const newTrips = tripsData.map((tripData) => ({
    fromId: tripData.fromId,
    toId: tripData.toId,
    seatsTotal: tripData.seatsTotal,
    departure: new Date(tripData.departure),
    arrival: new Date(tripData.arrival),
  }));

  // Get all existing trips for this route
  const existingTrips = await prisma.trip.findMany({
    where: {
      routeId: route.id,
      companyId: company.id,
    },
    select: {
      id: true,
      departure: true,
      arrival: true,
    },
  });

  const fmt = (d: Date) =>
    d.toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Check for overlaps
  for (const newTrip of newTrips) {
    // Check for exact duplicate
    const exactDuplicate = existingTrips.find(
      (existing) => existing.departure.getTime() === newTrip.departure.getTime()
    );

    if (exactDuplicate) {
      throw new Error(
        `Polazak u ${fmt(newTrip.departure)} već postoji za ovu rutu.`
      );
    }

    // Check for overlapping trips
    const overlappingTrip = existingTrips.find((existing) => {
      return (
        (newTrip.departure >= existing.departure &&
          newTrip.departure < existing.arrival) ||
        (newTrip.arrival > existing.departure &&
          newTrip.arrival <= existing.arrival) ||
        (newTrip.departure <= existing.departure &&
          newTrip.arrival >= existing.arrival) ||
        (existing.departure <= newTrip.departure &&
          existing.arrival >= newTrip.arrival)
      );
    });

    if (overlappingTrip) {
      throw new Error(
        `Polazak od ${fmt(newTrip.departure)} do ${fmt(newTrip.arrival)} ` +
          `preklapa se sa postojećim polaskom ` +
          `${fmt(overlappingTrip.departure)} – ${fmt(overlappingTrip.arrival)}.`
      );
    }
  }

  // Check for overlaps within the new trips themselves
  for (let i = 0; i < newTrips.length; i++) {
    for (let j = i + 1; j < newTrips.length; j++) {
      const trip1 = newTrips[i];
      const trip2 = newTrips[j];

      const overlap =
        (trip1.departure >= trip2.departure &&
          trip1.departure < trip2.arrival) ||
        (trip1.arrival > trip2.departure && trip1.arrival <= trip2.arrival) ||
        (trip1.departure <= trip2.departure &&
          trip1.arrival >= trip2.arrival) ||
        (trip2.departure <= trip1.departure && trip2.arrival >= trip1.arrival);

      if (overlap) {
        throw new Error(
          `Polasci se međusobno preklapaju: ` +
            `${fmt(trip1.departure)} – ${fmt(trip1.arrival)} ` +
            `i ${fmt(trip2.departure)} – ${fmt(trip2.arrival)}.`
        );
      }
    }
  }

  // Create all trips
  const createdTrips = await Promise.all(
    tripsData.map(async (tripData) => {
      return prisma.trip.create({
        data: {
          routeId: route.id,
          companyId: company.id,
          departure: new Date(tripData.departure),
          arrival: new Date(tripData.arrival),
          seatsTotal: tripData.seatsTotal,
        },
      });
    })
  );

  revalidatePath('/company');
  return createdTrips;
}

interface RecurringTripInput {
  fromId: number;
  toId: number;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  daysOfWeek: number[]; // 0=Sun, 1=Mon … 6=Sat
  timeSlots: Array<{ departureTime: string; arrivalTime: string }>;
  seatsTotal: number;
  duration?: number; // minutes
  distance?: number; // km
}

export async function getRouteInfo(fromId: number, toId: number) {
  const company = await getCurrentCompany();
  return prisma.route.findUnique({
    where: { fromId_toId_companyId: { companyId: company.id, fromId, toId } },
    select: { duration: true, distance: true },
  });
}

export async function updateRouteMetadata(
  routeId: number,
  duration: number | null,
  distance: number | null,
) {
  const company = await getCurrentCompany();
  const route = await prisma.route.findFirst({ where: { id: routeId, companyId: company.id } });
  if (!route) throw new Error('Ruta nije pronađena.');
  await prisma.route.update({
    where: { id: routeId },
    data: {
      ...(duration != null && { duration }),
      ...(distance != null && { distance }),
    },
  });
  revalidatePath('/company');
}

export async function generateRecurringTrips(input: RecurringTripInput) {
  const company = await getCurrentCompany();

  if (input.daysOfWeek.length === 0 || input.timeSlots.length === 0) {
    throw new Error('Izaberite bar jedan dan i jedno vreme polaska.');
  }

  let route = await prisma.route.findUnique({
    where: {
      fromId_toId_companyId: {
        companyId: company.id,
        fromId: input.fromId,
        toId: input.toId,
      },
    },
  });

  if (!route) {
    route = await prisma.route.create({
      data: {
        companyId: company.id,
        fromId: input.fromId,
        toId: input.toId,
        ...(input.duration != null && { duration: input.duration }),
        ...(input.distance != null && { distance: input.distance }),
      },
    });
  } else if (input.duration != null || input.distance != null) {
    route = await prisma.route.update({
      where: { id: route.id },
      data: {
        ...(input.duration != null && { duration: input.duration }),
        ...(input.distance != null && { distance: input.distance }),
      },
    });
  }

  const existing = await prisma.trip.findMany({
    where: { routeId: route.id, companyId: company.id },
    select: { departure: true },
  });
  const existingTimes = new Set(existing.map((t) => t.departure.getTime()));

  const { DateTime } = await import('luxon');
  const [sy, sm, sd] = input.startDate.split('-').map(Number);
  const [ey, em, ed] = input.endDate.split('-').map(Number);

  let current = DateTime.fromObject(
    { year: sy, month: sm, day: sd },
    { zone: 'Europe/Belgrade' }
  );
  const end = DateTime.fromObject(
    { year: ey, month: em, day: ed },
    { zone: 'Europe/Belgrade' }
  );

  if (end.diff(current, 'days').days > 730) {
    throw new Error('Period ne može biti duži od 2 godine.');
  }

  const tripsData: Array<{
    routeId: number;
    companyId: number;
    departure: Date;
    arrival: Date;
    seatsTotal: number;
  }> = [];

  while (current <= end) {
    const jsDay = current.weekday % 7; // Luxon Mon=1..Sun=7 → JS Mon=1..Sun=0

    if (input.daysOfWeek.includes(jsDay)) {
      for (const slot of input.timeSlots) {
        const [depH, depM] = slot.departureTime.split(':').map(Number);
        const [arrH, arrM] = slot.arrivalTime.split(':').map(Number);

        const departure = current
          .set({ hour: depH, minute: depM, second: 0, millisecond: 0 })
          .toUTC()
          .toJSDate();

        const isNextDay = arrH < depH || (arrH === depH && arrM < depM);
        const arrivalDay = isNextDay ? current.plus({ days: 1 }) : current;
        const arrival = arrivalDay
          .set({ hour: arrH, minute: arrM, second: 0, millisecond: 0 })
          .toUTC()
          .toJSDate();

        if (!existingTimes.has(departure.getTime())) {
          tripsData.push({
            routeId: route.id,
            companyId: company.id,
            departure,
            arrival,
            seatsTotal: input.seatsTotal,
          });
        }
      }
    }

    current = current.plus({ days: 1 });
  }

  if (tripsData.length > 0) {
    await prisma.trip.createMany({ data: tripsData, skipDuplicates: true });
  }

  revalidatePath('/company');
  return { created: tripsData.length };
}

export async function updateCompanySettings(formData: FormData) {
  const company = await getCurrentCompany();

  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const currentPassword = (formData.get('currentPassword') as string) ?? '';
  const newPassword = (formData.get('newPassword') as string) ?? '';
  const confirmPassword = (formData.get('confirmPassword') as string) ?? '';

  if (!name || !email) {
    throw new Error('Naziv kompanije i email su obavezni.');
  }

  if (email !== company.email) {
    const existing = await prisma.company.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email adresa je već u upotrebi.');
    }
  }

  const changingPassword = currentPassword || newPassword || confirmPassword;

  if (changingPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error('Za promenu lozinke sva tri polja su obavezna.');
    }
    if (newPassword.length < 8) {
      throw new Error('Nova lozinka mora imati najmanje 8 karaktera.');
    }
    if (newPassword !== confirmPassword) {
      throw new Error('Nove lozinke se ne poklapaju.');
    }

    const row = await prisma.company.findUnique({ where: { id: company.id } });
    const isValid = await bcrypt.compare(currentPassword, row!.password);
    if (!isValid) {
      throw new Error('Trenutna lozinka nije ispravna.');
    }
  }

  const hashed = changingPassword ? await bcrypt.hash(newPassword, 10) : undefined;

  await prisma.company.update({
    where: { id: company.id },
    data: {
      name,
      email,
      ...(hashed && { password: hashed }),
    },
  });

  revalidatePath('/company');
}

export async function cancelReservation(
  token: string,
): Promise<{ success: boolean; error?: 'invalid_token' | 'not_found' | 'already_departed' }> {
  const reservationId = verifyReservationToken(token);
  if (!reservationId) return { success: false, error: 'invalid_token' };

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { trip: true },
  });

  if (!reservation) return { success: false, error: 'not_found' };
  if (new Date(reservation.trip.departure) < new Date()) {
    return { success: false, error: 'already_departed' };
  }

  await prisma.reservation.delete({ where: { id: reservationId } });
  return { success: true };
}

function countSeats(seats: unknown): number {
  return Array.isArray(seats) ? seats.length : 0;
}

export async function getCompanyStats() {
  const company = await getCurrentCompany();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // ── This-month summary ──────────────────────────────────────────────────────
  const [tripsThisMonth, reservationsThisMonth] = await Promise.all([
    prisma.trip.findMany({
      where: { companyId: company.id, departure: { gte: startOfMonth } },
      select: { seatsTotal: true, reservations: { select: { seats: true } } },
    }),
    prisma.reservation.findMany({
      where: { companyId: company.id, createdAt: { gte: startOfMonth } },
      select: { seats: true },
    }),
  ]);

  const seatsSoldThisMonth = reservationsThisMonth.reduce(
    (sum, r) => sum + countSeats(r.seats),
    0
  );
  const capacityThisMonth = tripsThisMonth.reduce((sum, t) => sum + t.seatsTotal, 0);
  const occupancyThisMonth =
    capacityThisMonth > 0
      ? Math.round((seatsSoldThisMonth / capacityThisMonth) * 100)
      : 0;

  // ── Upcoming trips ──────────────────────────────────────────────────────────
  const upcomingRaw = await prisma.trip.findMany({
    where: { companyId: company.id, departure: { gte: now } },
    include: {
      route: { select: { from: { select: { name: true } }, to: { select: { name: true } } } },
      reservations: { select: { seats: true } },
    },
    orderBy: { departure: 'asc' },
    take: 10,
  });

  const upcomingTrips = upcomingRaw.map((t) => {
    const sold = t.reservations.reduce((sum, r) => sum + countSeats(r.seats), 0);
    return {
      id: t.id,
      from: t.route.from.name,
      to: t.route.to.name,
      departure: t.departure,
      seatsTotal: t.seatsTotal,
      seatsSold: sold,
    };
  });

  // ── Route performance (all time) ────────────────────────────────────────────
  const routesRaw = await prisma.route.findMany({
    where: { companyId: company.id },
    include: {
      from: { select: { name: true } },
      to: { select: { name: true } },
      trips: { include: { reservations: { select: { seats: true } } } },
    },
  });

  const routeStats = routesRaw.map((r) => {
    const totalTrips = r.trips.length;
    const totalPassengers = r.trips.reduce(
      (sum, t) => sum + t.reservations.reduce((s, res) => s + countSeats(res.seats), 0),
      0
    );
    const totalCapacity = r.trips.reduce((sum, t) => sum + t.seatsTotal, 0);
    const avgOccupancy =
      totalCapacity > 0 ? Math.round((totalPassengers / totalCapacity) * 100) : 0;

    return {
      from: r.from.name,
      to: r.to.name,
      totalTrips,
      totalPassengers,
      avgOccupancy,
    };
  });

  // ── Recent reservations ─────────────────────────────────────────────────────
  const recentRaw = await prisma.reservation.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      bookingRef: true,
      fullName: true,
      seats: true,
      createdAt: true,
      trip: {
        select: {
          departure: true,
          route: { select: { from: { select: { name: true } }, to: { select: { name: true } } } },
        },
      },
    },
  });

  const recentReservations = recentRaw.map((r) => ({
    id: r.id,
    bookingRef: r.bookingRef,
    fullName: r.fullName,
    seats: countSeats(r.seats),
    from: r.trip.route.from.name,
    to: r.trip.route.to.name,
    departure: r.trip.departure,
    createdAt: r.createdAt,
  }));

  return {
    thisMonth: {
      trips: tripsThisMonth.length,
      reservations: reservationsThisMonth.length,
      seatsSold: seatsSoldThisMonth,
      occupancy: occupancyThisMonth,
    },
    upcomingTrips,
    routeStats,
    recentReservations,
  };
}

// ─── Return trip booking ──────────────────────────────────────────────────────

type ReturnReservationState = { success: boolean; error?: string };

type TripDetails = {
  bookingRef: string;
  fromCity: string;
  toCity: string;
  departure: Date;
  arrival: Date;
  companyName: string;
  seats: number[];
  viewCancelUrl: string;
};

async function createReservationForTrip(
  tripId: number,
  fullName: string,
  email: string,
  requestedSeatsCount: number,
  returnOf?: string,
  skipEmail?: boolean,
): Promise<ReturnReservationState & { bookingRef?: string; token?: string; tripDetails?: TripDetails }> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      reservations: true,
      route: { include: { from: true, to: true } },
    },
  });

  if (!trip) return { success: false, error: 'Polazak nije pronađen.' };

  const takenSeats = new Set<number>();
  for (const r of trip.reservations) {
    if (Array.isArray(r.seats)) r.seats.forEach((s) => takenSeats.add(s as number));
  }

  if (requestedSeatsCount > trip.seatsTotal - takenSeats.size) {
    return { success: false, error: 'Nema dovoljno slobodnih sedišta.' };
  }

  const assignedSeats: number[] = [];
  let seat = 1;
  while (assignedSeats.length < requestedSeatsCount) {
    if (!takenSeats.has(seat)) assignedSeats.push(seat);
    seat++;
  }

  const company = await prisma.company.findFirst({ where: { id: trip.companyId } });
  if (!company) return { success: false, error: 'Prevoznik nije pronađen.' };

  const bookingRef = generateBookingRef();
  const reservation = await prisma.reservation.create({
    data: {
      bookingRef,
      fullName,
      email,
      seats: assignedSeats,
      tripId: trip.id,
      companyId: company.id,
      returnOf: returnOf ?? null,
    },
  });

  const token = signReservationToken(reservation.id);
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? vercelUrl ?? 'http://localhost:3000';

  const tripDetails: TripDetails = {
    bookingRef,
    fromCity: trip.route.from.name,
    toCity: trip.route.to.name,
    departure: trip.departure,
    arrival: trip.arrival,
    companyName: company.name,
    seats: assignedSeats,
    viewCancelUrl: `${baseUrl}/rezervacija/${token}`,
  };

  if (!skipEmail) {
    await sendBookingConfirmation({
      to: email,
      fullName,
      outbound: tripDetails,
      returnBookingUrl: `${baseUrl}/povratna-karta/${token}`,
    });
  }

  return { success: true, bookingRef, token, tripDetails };
}

export async function bookReturnReservation(
  _prev: ReturnReservationState,
  formData: FormData,
): Promise<ReturnReservationState> {
  try {
    const tripId = Number(formData.get('tripId'));
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const seats = Number(formData.get('seats'));
    const outboundBookingRef = formData.get('outboundBookingRef') as string;

    if (!tripId || !fullName || !email || !seats || !outboundBookingRef) {
      return { success: false, error: 'Sva polja su obavezna.' };
    }

    const result = await createReservationForTrip(tripId, fullName, email, seats, outboundBookingRef);
    return result;
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Greška.' };
  }
}

export async function rescheduleReturnReservation(
  _prev: ReturnReservationState,
  formData: FormData,
): Promise<ReturnReservationState> {
  try {
    const existingId = Number(formData.get('existingReservationId'));
    const newTripId = Number(formData.get('tripId'));
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const seats = Number(formData.get('seats'));
    const outboundBookingRef = formData.get('outboundBookingRef') as string;

    if (!existingId || !newTripId || !fullName || !email || !seats || !outboundBookingRef) {
      return { success: false, error: 'Sva polja su obavezna.' };
    }

    const existing = await prisma.reservation.findUnique({
      where: { id: existingId },
      include: { trip: true },
    });

    if (!existing) return { success: false, error: 'Rezervacija nije pronađena.' };

    const hoursUntilDep =
      (new Date(existing.trip.departure).getTime() - Date.now()) / 3_600_000;
    if (hoursUntilDep < 24) {
      return { success: false, error: 'Nije moguće menjati rezervaciju manje od 24 sata pre polaska.' };
    }

    await prisma.reservation.delete({ where: { id: existingId } });
    const result = await createReservationForTrip(newTripId, fullName, email, seats, outboundBookingRef);
    return result;
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Greška.' };
  }
}

export async function bookRoundTripReservation(
  _prev: ReturnReservationState,
  formData: FormData,
): Promise<ReturnReservationState> {
  try {
    const outboundTripId = Number(formData.get('outboundTripId'));
    const returnTripId = formData.get('returnTripId') ? Number(formData.get('returnTripId')) : null;
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const seats = Number(formData.get('seats'));

    if (!outboundTripId || !fullName || !email || !seats) {
      return { success: false, error: 'Sva polja su obavezna.' };
    }

    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? vercelUrl ?? 'http://localhost:3000';

    // Book both trips without sending individual emails
    const outboundResult = await createReservationForTrip(outboundTripId, fullName, email, seats, undefined, true);
    if (!outboundResult.success || !outboundResult.tripDetails) {
      return { success: false, error: outboundResult.error };
    }

    let returnDetails: TripDetails | undefined;
    if (returnTripId && outboundResult.bookingRef) {
      const returnResult = await createReservationForTrip(returnTripId, fullName, email, seats, outboundResult.bookingRef, true);
      returnDetails = returnResult.tripDetails;
    }

    // Send one combined email
    await sendBookingConfirmation({
      to: email,
      fullName,
      outbound: outboundResult.tripDetails,
      returnTrip: returnDetails,
      returnBookingUrl: returnDetails
        ? undefined
        : `${baseUrl}/povratna-karta/${outboundResult.token}`,
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Greška.' };
  }
}

export async function changeTripDate(
  token: string,
  newTripId: number,
): Promise<{ success: boolean; error?: string }> {
  const reservationId = verifyReservationToken(token);
  if (!reservationId) return { success: false, error: 'Nevažeći link.' };

  const existing = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      id: true,
      fullName: true,
      email: true,
      seats: true,
      returnOf: true,
      trip: { select: { departure: true } },
    },
  });

  if (!existing) return { success: false, error: 'Rezervacija nije pronađena.' };

  const hoursUntilDep =
    (new Date(existing.trip.departure).getTime() - Date.now()) / 3_600_000;
  if (hoursUntilDep < 24) {
    return { success: false, error: 'Nije moguće menjati datum manje od 24 sata pre polaska.' };
  }

  const seatsCount = Array.isArray(existing.seats) ? existing.seats.length : 1;

  await prisma.reservation.delete({ where: { id: reservationId } });

  const result = await createReservationForTrip(
    newTripId,
    existing.fullName,
    existing.email,
    seatsCount,
    existing.returnOf ?? undefined,
  );

  return { success: result.success, error: result.error };
}
