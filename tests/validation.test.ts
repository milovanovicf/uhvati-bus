import { reservationSchema, routeSchema, tripSchema, citySchema } from '@/lib/validation';

describe('reservationSchema', () => {
  const valid = {
    fullName: 'Marko Marković',
    email: 'marko@test.com',
    seats: 2,
    tripId: 1,
  };

  it('accepts valid input', () => {
    expect(() => reservationSchema.parse(valid)).not.toThrow();
  });

  it('rejects empty fullName', () => {
    expect(() => reservationSchema.parse({ ...valid, fullName: '' })).toThrow();
  });

  it('rejects fullName over 100 chars', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, fullName: 'a'.repeat(101) })
    ).toThrow();
  });

  it('rejects invalid email', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, email: 'not-an-email' })
    ).toThrow();
  });

  it('rejects 0 seats', () => {
    expect(() => reservationSchema.parse({ ...valid, seats: 0 })).toThrow();
  });

  it('rejects more than 10 seats', () => {
    expect(() => reservationSchema.parse({ ...valid, seats: 11 })).toThrow();
  });

  it('rejects non-integer seats', () => {
    expect(() => reservationSchema.parse({ ...valid, seats: 1.5 })).toThrow();
  });

  it('rejects negative tripId', () => {
    expect(() => reservationSchema.parse({ ...valid, tripId: -1 })).toThrow();
  });
});

describe('tripSchema', () => {
  const departure = new Date(Date.now() + 3_600_000).toISOString();
  const arrival = new Date(Date.now() + 7_200_000).toISOString();
  const valid = { fromId: 1, toId: 2, departure, arrival, seatsTotal: 50 };

  it('accepts valid input', () => {
    expect(() => tripSchema.parse(valid)).not.toThrow();
  });

  it('rejects arrival before departure', () => {
    expect(() =>
      tripSchema.parse({ ...valid, departure: arrival, arrival: departure })
    ).toThrow();
  });

  it('rejects arrival equal to departure', () => {
    expect(() =>
      tripSchema.parse({ ...valid, arrival: departure })
    ).toThrow();
  });

  it('rejects same fromId and toId', () => {
    expect(() => tripSchema.parse({ ...valid, toId: 1 })).toThrow();
  });

  it('rejects 0 seats', () => {
    expect(() => tripSchema.parse({ ...valid, seatsTotal: 0 })).toThrow();
  });

  it('rejects more than 200 seats', () => {
    expect(() => tripSchema.parse({ ...valid, seatsTotal: 201 })).toThrow();
  });

  it('rejects empty departure string', () => {
    expect(() => tripSchema.parse({ ...valid, departure: '' })).toThrow();
  });
});

describe('routeSchema', () => {
  it('accepts valid input', () => {
    expect(() => routeSchema.parse({ fromId: 1, toId: 2 })).not.toThrow();
  });

  it('rejects same fromId and toId', () => {
    expect(() => routeSchema.parse({ fromId: 1, toId: 1 })).toThrow();
  });

  it('rejects non-positive fromId', () => {
    expect(() => routeSchema.parse({ fromId: 0, toId: 2 })).toThrow();
  });

  it('rejects non-positive toId', () => {
    expect(() => routeSchema.parse({ fromId: 1, toId: -1 })).toThrow();
  });
});

describe('citySchema', () => {
  it('accepts a valid city name', () => {
    expect(() => citySchema.parse({ name: 'Beograd' })).not.toThrow();
  });

  it('rejects empty name', () => {
    expect(() => citySchema.parse({ name: '' })).toThrow();
  });

  it('rejects name over 100 chars', () => {
    expect(() => citySchema.parse({ name: 'a'.repeat(101) })).toThrow();
  });
});
