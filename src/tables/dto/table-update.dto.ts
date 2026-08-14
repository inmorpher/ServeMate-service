import { TableCondition } from '@prisma/client';
import { z } from 'zod';

const positiveInt = z.coerce.number().int().positive();
const nonNegativeInt = z.coerce.number().int().nonnegative();

export const TableUpdateSchema = z
  .object({
    tableNumber: positiveInt.optional(),
    capacity: positiveInt.optional(),
    additionalCapacity: nonNegativeInt.optional(),
    status: z.enum(TableCondition).optional(),
    isOccupied: z.preprocess(value => {
      if (value === 'true' || value === true) return true;
      if (value === 'false' || value === false) return false;
      return value;
    }, z.boolean().optional()),
    guests: nonNegativeInt.optional(),
  })
  .refine(value => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export type TableUpdateDto = z.infer<typeof TableUpdateSchema>;
