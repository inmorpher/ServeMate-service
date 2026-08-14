import { ReservationStatus } from '@prisma/client';
import { z } from 'zod';

export const ReservationQuerySchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: z.preprocess(
    value => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(ReservationStatus).optional()
  ),
  guestsCount: z.coerce.number().int().positive().optional(),
  guestsCountMin: z.coerce.number().int().positive().optional(),
  guestsCountMax: z.coerce.number().int().positive().optional(),
  timeStart: z.coerce.date().optional(),
  timeEnd: z.coerce.date().optional(),
  tables: z.preprocess(value => {
    if (typeof value === 'string') return value.split(',');
    return value;
  }, z.array(z.coerce.number().int().positive()).optional()),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z
    .enum(['id', 'time', 'createdAt', 'updatedAt', 'guestsCount', 'status'])
    .default('time'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const ReservationParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const ReservationStatusSchema = z.object({
  status: z.preprocess(
    value => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(ReservationStatus)
  ),
});

export const ReservationTimeSchema = z.object({ time: z.coerce.date() });
export const ReservationTablesSchema = z.object({
  tables: z.array(z.coerce.number().int().positive()),
});

export type ReservationQueryDto = z.infer<typeof ReservationQuerySchema>;
export type ReservationParamsDto = z.infer<typeof ReservationParamsSchema>;
export type ReservationStatusDto = z.infer<typeof ReservationStatusSchema>;
export type ReservationTimeDto = z.infer<typeof ReservationTimeSchema>;
export type ReservationTablesDto = z.infer<typeof ReservationTablesSchema>;
