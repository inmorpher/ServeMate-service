import { DrinkCategory, DrinkTemp } from '@prisma/client';
import { z } from 'zod';

export const drinkItemSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().min(3),
  price: z.number().nonnegative(),
  description: z.string().min(3),
  volume: z.number().positive(),
  ingredients: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
  category: z.enum(DrinkCategory),
  alcoholPercentage: z.number().nullable(),
  isCarbonated: z.boolean().default(false),
  tempriture: z.enum(DrinkTemp),
  popularityScore: z.number().nonnegative().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  image: z.string().nullable().default(null),
});

export const drinkItemsListSchema = z.object({
  items: z.array(drinkItemSchema),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export const DrinkItemSortOptions = {
  ID: 'id',
  NAME: 'name',
  PRICE: 'price',
  IS_AVAILABLE: 'isAvailable',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  CATEGORY: 'category',
  VOLUME: 'volume',
} as const;

export type DrinkItemDTO = z.infer<typeof drinkItemSchema>;
export type DrinkItemsListDTO = z.infer<typeof drinkItemsListSchema>;
