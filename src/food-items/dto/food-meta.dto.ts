import { FoodCategory, FoodType } from '@prisma/client';
import { z } from 'zod';

export const FoodMetaSchema = z.object({
  categories: z.array(z.enum(FoodCategory)),
  types: z.array(z.enum(FoodType)),
  ingredients: z.array(z.string()),
  availabilityStates: z.array(z.boolean()),
  booleanFilterValues: z.array(z.boolean()),
  priceRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }),
});

export type FoodMetaDto = z.infer<typeof FoodMetaSchema>;
