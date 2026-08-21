import { DrinkCategory } from '@prisma/client';
import { z } from 'zod';
import { DrinkItemSortOptions } from './drink-base.dto';
export const searchDrinkItemsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z
    .enum([
      DrinkItemSortOptions.ID,
      DrinkItemSortOptions.NAME,
      DrinkItemSortOptions.PRICE,
      DrinkItemSortOptions.IS_AVAILABLE,
      DrinkItemSortOptions.CREATED_AT,
      DrinkItemSortOptions.UPDATED_AT,
      DrinkItemSortOptions.CATEGORY,
      DrinkItemSortOptions.VOLUME,
    ])
    .default(DrinkItemSortOptions.ID),

  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  name: z.string().optional(),
  category: z.enum(DrinkCategory).optional(),
  isAvailable: z.coerce.boolean().optional(),
  volume: z.coerce.number().optional(),
  ingredients: z.array(z.string()).optional(),
});
export type SearchDrinkItemsDTO = z.infer<typeof searchDrinkItemsSchema>;
