import { TableCondition } from '@prisma/client';
import { z } from 'zod';

export { TableCondition };

const positiveInt = z.coerce.number().int().positive();
const nonNegativeInt = z.coerce.number().int().nonnegative();

export const TableSchema = z.object({
  id: positiveInt,
  tableNumber: positiveInt,
  capacity: positiveInt,
  status: z.enum(TableCondition),
  additionalCapacity: nonNegativeInt,
  isOccupied: z.boolean(),
  originalCapacity: positiveInt,
  guests: nonNegativeInt,
});

export type TableDto = z.infer<typeof TableSchema>;

export type TableListResponse = {
  tables: TableDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
