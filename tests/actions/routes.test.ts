import { deleteRoute } from '@/app/actions';
import jwt from 'jsonwebtoken';

jest.mock('@/app/utils/db', () => ({
  prisma: {
    company: { findFirst: jest.fn() },
    route: { findFirst: jest.fn(), delete: jest.fn() },
    trip: { deleteMany: jest.fn() },
    reservation: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

import { prisma } from '@/app/utils/db';
import { cookies } from 'next/headers';

const mockCompany = { id: 1, name: 'Test Prevoz', email: 'test@prevoz.com' };

function mockAuth() {
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET!);
  (cookies as jest.Mock).mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: token }),
    set: jest.fn(),
  });
  (prisma.company.findFirst as jest.Mock).mockResolvedValue(mockCompany);
}

describe('deleteRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('deletes reservations, trips, and the route in a transaction', async () => {
    const mockRoute = {
      id: 1,
      companyId: 1,
      trips: [{ id: 10 }, { id: 11 }],
    };
    (prisma.route.findFirst as jest.Mock).mockResolvedValue(mockRoute);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    await deleteRoute(1);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    // Verify each cascade operation was queued with the correct args
    expect(prisma.reservation.deleteMany).toHaveBeenCalledWith({
      where: { tripId: { in: [10, 11] } },
    });
    expect(prisma.trip.deleteMany).toHaveBeenCalledWith({
      where: { routeId: 1 },
    });
    expect(prisma.route.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('works when the route has no trips (empty cascade)', async () => {
    const emptyRoute = { id: 2, companyId: 1, trips: [] };
    (prisma.route.findFirst as jest.Mock).mockResolvedValue(emptyRoute);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    await deleteRoute(2);

    expect(prisma.reservation.deleteMany).toHaveBeenCalledWith({
      where: { tripId: { in: [] } },
    });
  });

  it('throws when route is not found', async () => {
    (prisma.route.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(deleteRoute(999)).rejects.toThrow();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('throws when route belongs to a different company', async () => {
    // findFirst with companyId filter returns null → unauthorized
    (prisma.route.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(deleteRoute(5)).rejects.toThrow();
  });

  it('throws when not authenticated', async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    await expect(deleteRoute(1)).rejects.toThrow();
  });
});
