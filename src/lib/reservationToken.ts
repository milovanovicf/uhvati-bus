import jwt from 'jsonwebtoken';

const TYPE = 'reservation-access';

export function signReservationToken(reservationId: number): string {
  return jwt.sign(
    { reservationId, type: TYPE },
    process.env.JWT_SECRET!,
    { expiresIn: '365d' },
  );
}

export function verifyReservationToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      reservationId: number;
      type: string;
    };
    if (payload.type !== TYPE) return null;
    return payload.reservationId;
  } catch {
    return null;
  }
}
