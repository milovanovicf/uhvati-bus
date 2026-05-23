import { handleReservationCreate, handleReservationDelete } from '@/app/actions';

// handleReservationCreate and handleReservationDelete do NOT call getCurrentCompany
// so no auth mocking is needed — they look up company via trip.companyId directly.

jest.mock('@/app/utils/db', () => ({
  prisma: {
    company: { findFirst: jest.fn() },
    trip: { findUnique: jest.fn(), findFirst: jest.fn() },
    route: { findFirst: jest.fn() },
    reservation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ get: jest.fn(), set: jest.fn() }),
}));

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

import { prisma } from '@/app/utils/db';

const mockCompany = { id: 1, name: 'Test Prevoz', email: 'test@prevoz.com' };

const mockTrip = {
  id: 10,
  routeId: 1,
  companyId: 1,
  departure: new Date('2025-06-01T08:00:00Z'),
  arrival: new Date('2025-06-01T10:00:00Z'),
  seatsTotal: 50,
  reservations: [],
};

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const data = new Map<string, string>([
    ['fullName', 'Marko Marković'],
    ['email', 'marko@test.com'],
    ['seats', '2'],
    ['fromCityId', '1'],
    ['toCityId', '2'],
    ['date', '2025-06-01'],
    ['time', '08:00'],
    ['tripId', '10'],
    ...Object.entries(overrides),
  ]);
  return { get: (key: string) => data.get(key) ?? null } as unknown as FormData;
}

// ─── handleReservationCreate ──────────────────────────────────────────────────

describe('handleReservationCreate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('successfully creates a reservation and assigns consecutive seats', async () => {
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
    (prisma.company.findFirst as jest.Mock).mockResolvedValue(mockCompany);
    const created = { id: 1, fullName: 'Marko Marković', email: 'marko@test.com', seats: [1, 2], tripId: 10, companyId: 1, createdAt: new Date() };
    (prisma.reservation.create as jest.Mock).mockResolvedValue(created);

    const result = await handleReservationCreate({ success: false }, makeFormData());

    expect(result.success).toBe(true);
    expect(prisma.reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fullName: 'Marko Marković',
          email: 'marko@test.com',
          seats: [1, 2],
          tripId: 10,
        }),
      })
    );
  });

  it('assigns seats starting after already-taken ones', async () => {
    const tripWithReservation = {
      ...mockTrip,
      reservations: [{ seats: [1, 2, 3] }],
    };
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue(tripWithReservation);
    (prisma.company.findFirst as jest.Mock).mockResolvedValue(mockCompany);
    (prisma.reservation.create as jest.Mock).mockResolvedValue({});

    await handleReservationCreate({ success: false }, makeFormData({ seats: '2' }));

    expect(prisma.reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ seats: [4, 5] }),
      })
    );
  });

  it('returns error when requested seats exceed availability', async () => {
    const fullTrip = {
      ...mockTrip,
      seatsTotal: 3,
      reservations: [{ seats: [1, 2, 3] }],
    };
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue(fullTrip);

    const result = await handleReservationCreate(
      { success: false },
      makeFormData({ seats: '1' })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(prisma.reservation.create).not.toHaveBeenCalled();
  });

  it('returns error when trip is not found', async () => {
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await handleReservationCreate({ success: false }, makeFormData());

    expect(result.success).toBe(false);
    expect(prisma.reservation.create).not.toHaveBeenCalled();
  });

  it('returns error when required fields are missing', async () => {
    const result = await handleReservationCreate(
      { success: false },
      makeFormData({ fullName: '' })
    );

    expect(result.success).toBe(false);
    expect(prisma.trip.findUnique).not.toHaveBeenCalled();
  });
});

// ─── handleReservationDelete ──────────────────────────────────────────────────

describe('handleReservationDelete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('successfully deletes a reservation', async () => {
    const mockReservation = { id: 5, fullName: 'Marko', email: 'marko@test.com', seats: [1], tripId: 10, companyId: 1, createdAt: new Date() };
    (prisma.reservation.findUnique as jest.Mock).mockResolvedValue(mockReservation);
    (prisma.reservation.delete as jest.Mock).mockResolvedValue(mockReservation);

    const result = await handleReservationDelete(5);

    expect(result.success).toBe(true);
    expect(prisma.reservation.delete).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it('returns error when reservation is not found', async () => {
    (prisma.reservation.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await handleReservationDelete(999);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(prisma.reservation.delete).not.toHaveBeenCalled();
  });
});
