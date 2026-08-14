import { OrderState } from '@prisma/client';
import z from 'zod';
import { CreateGuestItemsSchema } from './order-item.dto';

export const OrderUpdateSchema = z
  .object({
    tableNumber: z.coerce.number().int().positive().optional(),
    guestsCount: z.coerce.number().int().positive().optional(),
    status: z.enum(OrderState).optional(),
    comments: z.string().nullable().optional(),
    discount: z.coerce.number().nonnegative().optional(),
    tip: z.coerce.number().nonnegative().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update.',
    path: ['body'],
  });

export type OrderUpdate = z.infer<typeof OrderUpdateSchema>;

export const OrderUpdateItemsSchema = z
  .object({
    foodItems: z.array(CreateGuestItemsSchema).default([]),
    drinkItems: z.array(CreateGuestItemsSchema).default([]),
  })
  .refine(data => data.foodItems.length > 0 || data.drinkItems.length > 0, {
    message: 'At least one food item or drink item must be provided.',
    path: ['body'],
  });

export type OrderUpdateItems = z.infer<typeof OrderUpdateItemsSchema>;

export const OrderItemIdsSchema = z
  .union([
    z.object({
      ids: z.array(z.coerce.number().int().positive()).min(1),
    }),
    z.object({
      orderItemsIds: z.array(z.coerce.number().int().positive()).min(1),
    }),
  ])
  .transform(data => ({
    ids: 'ids' in data ? data.ids : data.orderItemsIds,
  }));

export type OrderItemsIds = z.infer<typeof OrderItemIdsSchema>;
