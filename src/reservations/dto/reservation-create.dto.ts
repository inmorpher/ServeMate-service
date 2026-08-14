import { ReservationStatus } from '@prisma/client';
import { z } from 'zod';

export const ReservationCreateSchema = z.object({
  guestsCount: z.coerce.number().int().positive(),
  time: z.coerce.date(),
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(1),
  status: z.preprocess(
    value => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(ReservationStatus).default(ReservationStatus.PENDING)
  ),
  tables: z.array(z.coerce.number().int().positive()).default([]),
  comments: z.string().nullable().optional(),
});

export type ReservationCreateDto = z.infer<typeof ReservationCreateSchema>;
