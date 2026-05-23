'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from './utils/db';
import { Reservation } from '@/generated/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

type ReservationState = {
  success: boolean;
  error?: string;
  fieldErrors?: { [key: string]: string };
  reservation?: Reservation;
};

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
        route: true,
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

    const reservation = await prisma.reservation.create({
      data: {
        fullName,
        companyId: company.id,
        email,
        seats: assignedSeats,
        tripId: trip.id,
      },
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
        take: 50,
      },
    },
  });

  if (!company) {
    throw new Error('Company not found for user');
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
    take: 50,
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

  revalidatePath('/dashboard');
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

  revalidatePath('/dashboard');
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
