import { PaymentMethod, PaymentState } from '@prisma/client';
import { z } from 'zod';

export const PaymentMetaSchema = z.object({
  statuses: z.array(z.enum(PaymentState)),
  methods: z.array(z.enum(PaymentMethod)),
  orderIds: z.array(z.number().int().positive()),
  totalAmountRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }),
});

export type PaymentMetaDto = z.infer<typeof PaymentMetaSchema>;
