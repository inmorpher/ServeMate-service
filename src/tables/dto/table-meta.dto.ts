import { TableCondition } from '@prisma/client';
import { z } from 'zod';

export const TableMetaSchema = z.object({
  statuses: z.array(z.enum(TableCondition)),
  occupiedStates: z.array(z.boolean()),
  tableNumbers: z.array(z.number().int().positive()),
  capacityRange: z.object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative(),
  }),
});

export type TableMetaDto = z.infer<typeof TableMetaSchema>;
