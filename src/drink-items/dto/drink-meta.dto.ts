import { DrinkCategory } from '@prisma/client';
import { z } from 'zod';

export const DrinkMetaSchema = z.object({
  categories: z.array(z.enum(DrinkCategory)),
  ingredients: z.array(z.string()),
  availabilityStates: z.array(z.boolean()),
  volumeRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }),
  priceRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }),
});

export type DrinkMetaDto = z.infer<typeof DrinkMetaSchema>;
