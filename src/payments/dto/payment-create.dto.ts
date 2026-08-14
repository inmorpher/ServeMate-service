import { z } from 'zod';

export const PaymentCreateSchema = z.object({
  foodItems: z.array(z.coerce.number().int().positive()).default([]),
  drinkItems: z.array(z.coerce.number().int().positive()).default([]),
});

export type PaymentCreateDto = z.infer<typeof PaymentCreateSchema>;
