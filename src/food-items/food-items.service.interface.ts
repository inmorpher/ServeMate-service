import {
  CreateFoodItemDTO,
  FoodItemDTO,
  FoodItemsListDTO,
  FoodMetaDto,
  SearchFoodItemsDTO,
  UpdateFoodItemDTO,
} from './dto';

export interface IFoodItemsService {
  getMeta(): Promise<FoodMetaDto>;
  findFoodItems(criteria: SearchFoodItemsDTO): Promise<FoodItemsListDTO>;
  findFoodItemById(id: number): Promise<FoodItemDTO | null>;
  createFoodItem(data: CreateFoodItemDTO): Promise<FoodItemDTO>;
  updateFoodItem(id: number, data: UpdateFoodItemDTO): Promise<FoodItemDTO>;
  deleteFoodItem(id: number): Promise<void>;
}
