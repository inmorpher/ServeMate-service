import { z } from 'zod';

export const PaymentParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type PaymentParamsDto = z.infer<typeof PaymentParamsSchema>;
