import { foodItemSchema } from './food-base.dto';
export const updateFoodItemSchema = foodItemSchema.omit({ id: true }).partial();
export type UpdateFoodItemDTO = import('zod').infer<
  typeof updateFoodItemSchema
>;
