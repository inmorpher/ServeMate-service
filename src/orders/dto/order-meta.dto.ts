import { Allergy, OrderState } from '@prisma/client';
import z from 'zod';

export const OrderDateRangeSchema = z.object({
  min: z.string(),
  max: z.string(),
});

export const OrderPriceRangeSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
});

export const OrderMetaSchema = z.object({
  statuses: z.array(z.enum(OrderState)),
  allergies: z.array(z.enum(Allergy)),
  maxGuests: z.number().int().nonnegative(),
  prices: OrderPriceRangeSchema,
  dates: OrderDateRangeSchema,
  tableNumbers: z.array(z.number().int().positive()),
  filtered: z.object({
    maxGuests: z.number().int().nonnegative(),
    prices: OrderPriceRangeSchema,
    dates: OrderDateRangeSchema,
    tableNumbers: z.array(z.number().int().positive()),
  }),
});

export type OrderMetaDto = z.infer<typeof OrderMetaSchema>;
