import { ReservationStatus } from '@prisma/client';
import { z } from 'zod';
import { ReservationTableSchema } from './reservation-base.dto';

export const ReservationMetaSchema = z.object({
  statuses: z.array(z.enum(ReservationStatus)),
  tables: z.array(ReservationTableSchema),
  guestsCountRange: z.object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative(),
  }),
  timeRange: z.object({
    min: z.string(),
    max: z.string(),
  }),
});

export type ReservationMetaDto = z.infer<typeof ReservationMetaSchema>;
