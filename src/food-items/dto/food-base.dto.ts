import { Allergy, FoodCategory, FoodType, SpiceLevel } from '@prisma/client';
import { z } from 'zod';

export const foodItemSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().min(3),
  price: z.number().nonnegative(),
  description: z.string().min(3),
  ingredients: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
  popularityScore: z.number().nonnegative().default(0),
  image: z.string().nullable().default(null),
  category: z.enum(FoodCategory),
  type: z.enum(FoodType),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isVegetarian: z.boolean().default(false),
  allergies: z.array(z.enum(Allergy)).default([]),
  preparationTime: z.number().nonnegative().default(0),
  spicyLevel: z.enum(SpiceLevel).default(SpiceLevel.NOT_SPICY),
  calories: z.number().nullable().default(0),
});

export const foodItemsListSchema = z.object({
  items: z.array(foodItemSchema),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export const FoodItemSortOptions = {
  ID: 'id',
  NAME: 'name',
  PRICE: 'price',
  POPULARITY: 'popularityScore',
  IS_AVAILABLE: 'isAvailable',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  TYPE: 'type',
  CATEGORY: 'category',
  PREPARATION_TIME: 'preparationTime',
  SPICY_LEVEL: 'spicyLevel',
  CALORIES: 'calories',
  IS_VEGAN: 'isVegan',
  IS_GLUTEN_FREE: 'isGlutenFree',
} as const;

export type FoodItemDTO = z.infer<typeof foodItemSchema>;
export type FoodItemsListDTO = z.infer<typeof foodItemsListSchema>;
