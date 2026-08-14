import { Allergy, OrderState, PaymentState } from '@prisma/client';
import z from 'zod';

const OrderResponseItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().optional(),
  itemId: z.number().int().positive(),
  guestNumber: z.number().int().positive(),
  allergies: z.array(z.enum(Allergy)).default([]),
  price: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  finalPrice: z.number().nonnegative(),
  printed: z.boolean(),
  fired: z.boolean(),
  paymentStatus: z.enum(PaymentState),
  specialRequest: z.string().nullable(),
});

export const OrderGuestItemsSchema = z.object({
  guestNumber: z.number().int().positive(),
  items: z.array(OrderResponseItemSchema),
});

export const OrderResponseSchema = z.object({
  id: z.number().int().positive(),
  tableNumber: z.number().int().positive(),
  guestsCount: z.number().int().positive(),
  orderTime: z.date(),
  updatedAt: z.date(),
  serverId: z.number().int().positive(),
  status: z.enum(OrderState),
  comments: z.string().nullable(),
  completionTime: z.date().nullable(),
  totalAmount: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  tip: z.number().nonnegative(),
  shiftId: z.string().nullable(),
  allergies: z.array(z.enum(Allergy)),
  server: z.object({
    id: z.number().int().positive(),
    name: z.string(),
  }),
  foodItems: z.array(OrderGuestItemsSchema),
  drinkItems: z.array(OrderGuestItemsSchema),
});

export type OrderResponseDto = z.infer<typeof OrderResponseSchema>;

export const OrderListItemSchema = OrderResponseSchema.pick({
  id: true,
  status: true,
  server: true,
  tableNumber: true,
  guestsCount: true,
  orderTime: true,
  completionTime: true,
  updatedAt: true,
  comments: true,
  totalAmount: true,
  discount: true,
  tip: true,
});

export type OrderListItemDto = z.infer<typeof OrderListItemSchema>;

export const OrderSearchResultSchema = z.object({
  orders: z.array(OrderListItemSchema),
  priceRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }),
  dateRange: z.object({
    min: z.string(),
    max: z.string(),
  }),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export type OrderSearchResultDto = z.infer<typeof OrderSearchResultSchema>;
