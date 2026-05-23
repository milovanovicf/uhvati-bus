import request from 'supertest';
import { testServer } from '@/app/api/lib/testServer';
import * as tripsHandler from '@/app/api/trips/route';

jest.mock('@/app/utils/db', () => ({
  prisma: {
    trip: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/app/utils/db';

const BASE_PARAMS = 'fromId=1&toId=2&date=2025-06-01';

const makeTrip = (overrides: object = {}) => ({
  id: 1,
  routeId: 1,
  companyId: 1,
  departure: new Date('2025-06-01T08:00:00Z'),
  arrival: new Date('2025-06-01T10:00:00Z'),
  seatsTotal: 50,
  company: { id: 1, name: 'Test Prevoz', email: 'test@prevoz.com' },
  route: {
    from: { id: 1, name: 'Beograd' },
    to: { id: 2, name: 'Novi Sad' },
  },
  reservations: [],
  ...overrides,
});

describe('GET /api/trips', () => {
  const server = testServer(tripsHandler);

  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when fromId is missing', async () => {
    const res = await request(server).get('/?toId=2&date=2025-06-01');
    expect(res.status).toBe(400);
  });

  it('returns 400 when toId is missing', async () => {
    const res = await request(server).get('/?fromId=1&date=2025-06-01');
    expect(res.status).toBe(400);
  });

  it('returns 400 when date is missing', async () => {
    const res = await request(server).get('/?fromId=1&toId=2');
    expect(res.status).toBe(400);
  });

  it('returns 200 with an empty array when no trips exist', async () => {
    (prisma.trip.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(server).get(`/?${BASE_PARAMS}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns trips with availableSeats and takenSeats computed', async () => {
    (prisma.trip.findMany as jest.Mock).mockResolvedValue([
      makeTrip({ reservations: [{ id: 1, seats: [1, 2, 3] }] }),
    ]);

    const res = await request(server).get(`/?${BASE_PARAMS}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].availableSeats).toBe(47); // 50 - 3
    expect(res.body[0].takenSeats).toEqual([1, 2, 3]);
  });

  it('reports 0 available seats when fully booked', async () => {
    const takenSeats = Array.from({ length: 10 }, (_, i) => i + 1);
    (prisma.trip.findMany as jest.Mock).mockResolvedValue([
      makeTrip({ seatsTotal: 10, reservations: [{ id: 1, seats: takenSeats }] }),
    ]);

    const res = await request(server).get(`/?${BASE_PARAMS}`);

    expect(res.body[0].availableSeats).toBe(0);
    expect(res.body[0].availableSeatNumbers).toEqual([]);
  });

  it('counts seats across multiple reservations', async () => {
    (prisma.trip.findMany as jest.Mock).mockResolvedValue([
      makeTrip({
        seatsTotal: 10,
        reservations: [
          { id: 1, seats: [1, 2] },
          { id: 2, seats: [3, 4] },
        ],
      }),
    ]);

    const res = await request(server).get(`/?${BASE_PARAMS}`);

    expect(res.body[0].availableSeats).toBe(6);
    expect(res.body[0].takenSeats).toEqual(expect.arrayContaining([1, 2, 3, 4]));
  });

  it('returns multiple trips sorted by departure', async () => {
    (prisma.trip.findMany as jest.Mock).mockResolvedValue([
      makeTrip({ id: 1, departure: new Date('2025-06-01T10:00:00Z') }),
      makeTrip({ id: 2, departure: new Date('2025-06-01T08:00:00Z') }),
    ]);

    const res = await request(server).get(`/?${BASE_PARAMS}`);

    expect(res.body).toHaveLength(2);
  });
});
