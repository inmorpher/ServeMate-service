import { TableCondition } from '@prisma/client';
import { z } from 'zod';

const positiveInt = z.coerce.number().int().positive();
const nonNegativeInt = z.coerce.number().int().nonnegative();

export const TableCreateSchema = z.object({
  tableNumber: positiveInt,
  capacity: positiveInt,
  additionalCapacity: nonNegativeInt.default(0),
  status: z.enum(TableCondition).default(TableCondition.AVAILABLE),
});

export type TableCreateDto = z.infer<typeof TableCreateSchema>;
