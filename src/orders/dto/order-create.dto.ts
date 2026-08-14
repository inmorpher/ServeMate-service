import { Allergy, OrderState } from '@prisma/client';
import z from 'zod';

import { CreateGuestItemsSchema } from './order-item.dto';

export const OrderCreateSchema = z
  .object({
    tableNumber: z.coerce.number().int().positive(),
    guestsCount: z.coerce.number().int().positive(),
    serverId: z.coerce.number().int().positive(),
    status: z.enum(OrderState).default(OrderState.RECEIVED),
    comments: z.string().nullable().optional(),
    discount: z.coerce.number().nonnegative().default(0),
    allergies: z.array(z.enum(Allergy)).default([]),
    foodItems: z.array(CreateGuestItemsSchema).default([]),
    drinkItems: z.array(CreateGuestItemsSchema).default([]),
  })
  .refine(order => order.foodItems.length > 0 || order.drinkItems.length > 0, {
    message: 'At least one food item or drink item must be provided.',
    path: ['foodItems', 'drinkItems'],
  });

export type OrderCreate = z.infer<typeof OrderCreateSchema>;
