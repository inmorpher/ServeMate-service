import {
  CreateFoodItemDTO,
  FoodItemDTO,
  FoodItemsListDTO,
  SearchFoodItemsDTO,
  UpdateFoodItemDTO,
} from './dto';

export interface IFoodItemsRepository {
  findMany(criteria: SearchFoodItemsDTO): Promise<FoodItemsListDTO>;
  findById(id: number): Promise<FoodItemDTO | null>;
  create(data: CreateFoodItemDTO): Promise<FoodItemDTO>;
  update(id: number, data: UpdateFoodItemDTO): Promise<FoodItemDTO>;
  delete(id: number): Promise<void>;
}
