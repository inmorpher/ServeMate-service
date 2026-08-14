import { z } from 'zod';

export const DrinkItemParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type DrinkItemParamsDto = z.infer<typeof DrinkItemParamsSchema>;
