import { Allergy, PaymentState } from '@prisma/client';
import z from 'zod';

export const OrderItemSchema = z.object({
  id: z.number().int().positive(),
  itemId: z.number().int().positive(),
  price: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  finalPrice: z.number().nonnegative().default(0),
  specialRequest: z.string().nullable().default(null),
  allergies: z.array(z.enum(Allergy)).default([]),
  printed: z.boolean().default(false),
  fired: z.boolean().default(false),
  guestNumber: z.number().int().positive(),
  paymentStatus: z.enum(PaymentState).default(PaymentState.NONE),
});

export type OrderItemDto = z.infer<typeof OrderItemSchema>;

export const GuestOrderItemSchema = OrderItemSchema.omit({
  id: true,
  guestNumber: true,
});

export const GuestItemsSchema = z.object({
  guestNumber: z.number().int().positive(),
  items: z.array(GuestOrderItemSchema),
});

export type GuestItems = z.infer<typeof GuestItemsSchema>;

export const OrderItemWithProductSchema = OrderItemSchema.extend({
  foodItem: z
    .object({
      id: z.number().int().positive(),
      name: z.string(),
    })
    .optional(),
  drinkItem: z
    .object({
      id: z.number().int().positive(),
      name: z.string(),
    })
    .optional(),
});

export type OrderItemWithProduct = z.infer<typeof OrderItemWithProductSchema>;
export const CreateOrderItemSchema = z.object({
  itemId: z.number().int().positive(),
  price: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  finalPrice: z.number().nonnegative().default(0),
  specialRequest: z.string().nullable().default(null),
  allergies: z.array(z.enum(Allergy)).default([]),
});

export const CreateGuestItemsSchema = z.object({
  guestNumber: z.number().int().positive(),
  items: z.array(CreateOrderItemSchema),
});

export type CreateGuestItems = z.infer<typeof CreateGuestItemsSchema>;
