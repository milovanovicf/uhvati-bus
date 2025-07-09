import { z } from 'zod';

export const reservationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name is too long' }),

  email: z.string().email({ message: 'Invalid email address' }),

  phone: z
    .string()
    .min(10, { message: 'Phone must be at least 10 characters' })
    .max(20, { message: 'Phone number is too long' }),

  seats: z
    .number()
    .int({ message: 'Seats must be an integer' })
    .min(1, { message: 'At least one seat must be reserved' })
    .max(10, { message: 'Cannot reserve more than 10 seats at once' }),

  tripId: z
    .number()
    .int({ message: 'Trip ID must be an integer' })
    .positive({ message: 'Trip ID must be positive' }),
});

export const citySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name is too long' }),
});

export const routeSchema = z
  .object({
    fromId: z.number().int().positive(),
    toId: z.number().int().positive(),
  })
  .refine((data) => data.fromId !== data.toId, {
    message: 'From and to cities must be different',
    path: ['toId'],
  });

export const tripSchema = z.object({});

export const deleteSchema = z.object({
  id: z.number().int().positive(),
});
