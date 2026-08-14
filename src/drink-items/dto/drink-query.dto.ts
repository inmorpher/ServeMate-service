import { DrinkCategory } from '@prisma/client';
import { z } from 'zod';
export const searchDrinkItemsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().default('id'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  name: z.string().optional(),
  category: z.enum(DrinkCategory).optional(),
  isAvailable: z.coerce.boolean().optional(),
  volume: z.coerce.number().optional(),
  ingredients: z.array(z.string()).optional(),
});
export type SearchDrinkItemsDTO = z.infer<typeof searchDrinkItemsSchema>;
