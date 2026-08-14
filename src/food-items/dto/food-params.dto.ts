import { z } from 'zod';

export const FoodItemParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type FoodItemParamsDto = z.infer<typeof FoodItemParamsSchema>;
