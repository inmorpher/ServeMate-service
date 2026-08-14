import { drinkItemSchema } from './drink-base.dto';
export const updateDrinkItemSchema = drinkItemSchema
  .omit({ id: true })
  .partial();
export type UpdateDrinkItemDTO = import('zod').infer<
  typeof updateDrinkItemSchema
>;
