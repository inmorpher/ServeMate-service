import { drinkItemSchema } from './drink-base.dto';
export const createDrinkItemSchema = drinkItemSchema.omit({ id: true });
export type CreateDrinkItemDTO = import('zod').infer<
  typeof createDrinkItemSchema
>;
