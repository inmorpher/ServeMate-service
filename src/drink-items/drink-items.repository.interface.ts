import {
  CreateDrinkItemDTO,
  DrinkItemDTO,
  DrinkItemsListDTO,
  SearchDrinkItemsDTO,
  UpdateDrinkItemDTO,
} from './dto';

export interface IDrinkItemsRepository {
  findMany(criteria: SearchDrinkItemsDTO): Promise<DrinkItemsListDTO>;
  findById(id: number): Promise<DrinkItemDTO | null>;
  create(data: CreateDrinkItemDTO): Promise<DrinkItemDTO>;
  update(id: number, data: UpdateDrinkItemDTO): Promise<DrinkItemDTO>;
  delete(id: number): Promise<void>;
}
