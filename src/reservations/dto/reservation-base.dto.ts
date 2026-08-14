import { ReservationStatus } from '@prisma/client';
import { z } from 'zod';

export { ReservationStatus };

export const ReservationTableSchema = z.object({
  id: z.number().int().positive(),
  tableNumber: z.number().int().positive(),
});

export const ReservationSchema = z.object({
  id: z.number().int().positive(),
  guestsCount: z.number().int().positive(),
  time: z.date(),
  name: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().min(1),
  status: z.enum(ReservationStatus),
  tables: z.array(ReservationTableSchema),
  comments: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean(),
});

export type ReservationDto = z.infer<typeof ReservationSchema>;
export type ReservationTableDto = z.infer<typeof ReservationTableSchema>;

export type ReservationConflictDto = {
  reservationId: number;
  time: Date;
  tables: ReservationTableDto[];
};

export type ReservationDetailedDto = {
  reservation: ReservationDto;
  conflict: ReservationConflictDto[];
};

export type ReservationListResponse = {
  list: ReservationDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
