import request from 'supertest';
import { testServer } from '@/app/api/lib/testServer';
import * as handler from '@/app/api/reserve/route';
import prisma from '@/lib/prisma';
import { City, Company, Trip, Route } from '@/generated/prisma';
import bcrypt from 'bcrypt';
import { resetDatabase } from '@/tests/setup/resetSpecDb';

describe('/api/reserve', () => {
  let server: any;
  let company: Company;
  let trip: Trip;
  let city1: City;
  let city2: City;
  let route: Route;

  beforeAll(async () => {
    server = testServer(handler);
    await resetDatabase();

    company = await prisma.company.create({
      data: {
        name: 'Lasta',
        email: 'lasta@uhvati.rs',
        password: await bcrypt.hash('secure123', 10),
      },
    });

    city1 = await prisma.city.create({
      data: {
        name: 'Krusevac',
      },
    });

    city2 = await prisma.city.create({
      data: {
        name: 'Belgrade',
      },
    });

    route = await prisma.route.create({
      data: {
        fromId: city1.id,
        toId: city2.id,
      },
    });

    trip = await prisma.trip.create({
      data: {
        departure: new Date(new Date().setHours(15, 0, 0, 0)),
        arrival: new Date(new Date().setHours(17, 30, 0, 0)),
        seatsTotal: 10,
        companyId: company.id,
        routeId: route.id,
      },
    });
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('successfully creates a reservation for a trip', async () => {
    const response = await request(server).post('/api/reserve').send({
      name: 'Petar',
      email: 'petar@email.com',
      phone: '+381601234567',
      seats: 2,
      tripId: trip.id,
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: 'Reservation successful',
    });

    const reservation = await prisma.reservation.findFirst({
      where: { email: 'petar@email.com' },
    });

    expect(reservation).toMatchObject({
      name: 'Petar',
      email: 'petar@email.com',
      phone: '+381601234567',
      seats: 2,
      tripId: trip.id,
    });
  });
});
