import { foodItemSchema } from './food-base.dto';
export const createFoodItemSchema = foodItemSchema.omit({ id: true });
export type CreateFoodItemDTO = import('zod').infer<
  typeof createFoodItemSchema
>;
