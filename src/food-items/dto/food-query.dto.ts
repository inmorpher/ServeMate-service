import { FoodCategory, FoodType } from '@prisma/client';
import { z } from 'zod';
import { FoodItemSortOptions } from './food-base.dto';
export const searchFoodItemsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z
    .enum([
      FoodItemSortOptions.ID,
      FoodItemSortOptions.NAME,
      FoodItemSortOptions.PRICE,
      FoodItemSortOptions.POPULARITY,
      FoodItemSortOptions.IS_AVAILABLE,
      FoodItemSortOptions.CREATED_AT,
      FoodItemSortOptions.UPDATED_AT,
      FoodItemSortOptions.TYPE,
      FoodItemSortOptions.CATEGORY,
      FoodItemSortOptions.PREPARATION_TIME,
      FoodItemSortOptions.SPICY_LEVEL,
      FoodItemSortOptions.CALORIES,
      FoodItemSortOptions.IS_VEGAN,
      FoodItemSortOptions.IS_GLUTEN_FREE,
    ])
    .default(FoodItemSortOptions.ID),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  name: z.string().optional(),
  category: z.enum(FoodCategory).optional(),
  type: z.enum(FoodType).optional(),
  isAvailable: z.coerce.boolean().optional(),
  price: z.coerce.number().nonnegative().optional(),
  isVegan: z.coerce.boolean().optional(),
  isGlutenFree: z.coerce.boolean().optional(),
  isVegetarian: z.coerce.boolean().optional(),
  ingredients: z.array(z.string()).optional(),
});
export type SearchFoodItemsDTO = z.infer<typeof searchFoodItemsSchema>;
