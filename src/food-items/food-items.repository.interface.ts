import {
  CreateFoodItemDTO,
  FoodItemDTO,
  FoodItemsListDTO,
  FoodMetaDto,
  SearchFoodItemsDTO,
  UpdateFoodItemDTO,
} from './dto';

export interface IFoodItemsRepository {
  getMeta(): Promise<FoodMetaDto>;
  findMany(criteria: SearchFoodItemsDTO): Promise<FoodItemsListDTO>;
  findById(id: number): Promise<FoodItemDTO | null>;
  create(data: CreateFoodItemDTO): Promise<FoodItemDTO>;
  update(id: number, data: UpdateFoodItemDTO): Promise<FoodItemDTO>;
  delete(id: number): Promise<void>;
}
