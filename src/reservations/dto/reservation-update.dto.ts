import { ReservationStatus } from '@prisma/client';
import { z } from 'zod';

const reservationFields = z.object({
  guestsCount: z.coerce.number().int().positive().optional(),
  time: z.coerce.date().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(1).optional(),
  status: z.preprocess(
    value => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(ReservationStatus).optional()
  ),
  tables: z.array(z.coerce.number().int().positive()).optional(),
  comments: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const ReservationUpdateSchema = reservationFields.refine(
  value => Object.keys(value).length > 0,
  { message: 'At least one field must be provided' }
);

export const ReservationGuestInfoSchema = z
  .object({
    guestsCount: z.coerce.number().int().positive().optional(),
    name: z.string().min(1).optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().min(1).optional(),
  })
  .refine(value => Object.keys(value).length > 0, {
    message: 'At least one guest field must be provided',
  });

export type ReservationUpdateDto = z.infer<typeof ReservationUpdateSchema>;
export type ReservationGuestInfoDto = z.infer<
  typeof ReservationGuestInfoSchema
>;
