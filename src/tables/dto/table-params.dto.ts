import { z } from 'zod';

export const TableParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type TableParamsDto = z.infer<typeof TableParamsSchema>;
