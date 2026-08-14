import { TableCondition } from '@prisma/client';
import { z } from 'zod';

export const TableSortColumn = {
  ID: 'id',
  TABLE_NUMBER: 'tableNumber',
  CAPACITY: 'capacity',
  STATUS: 'status',
  IS_OCCUPIED: 'isOccupied',
  GUESTS: 'guests',
} as const;

export type TableSortColumn =
  (typeof TableSortColumn)[keyof typeof TableSortColumn];

const positiveInt = z.coerce.number().int().positive();

export const TableQuerySchema = z.object({
  id: positiveInt.optional(),
  tableNumber: positiveInt.optional(),
  minCapacity: positiveInt.optional(),
  maxCapacity: positiveInt.optional(),
  status: z.preprocess(
    value => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(TableCondition).optional()
  ),
  isOccupied: z.preprocess(value => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  }, z.boolean().optional()),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(TableSortColumn).default(TableSortColumn.ID),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type TableQueryDto = z.infer<typeof TableQuerySchema>;
