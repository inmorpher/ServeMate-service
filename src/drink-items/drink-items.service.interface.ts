import {
  CreateDrinkItemDTO,
  DrinkItemDTO,
  DrinkItemsListDTO,
  SearchDrinkItemsDTO,
  UpdateDrinkItemDTO,
} from './dto';

export interface IDrinkItemsService {
  findDrinkItems(criteria: SearchDrinkItemsDTO): Promise<DrinkItemsListDTO>;
  findDrinkItemById(id: number): Promise<DrinkItemDTO | null>;
  createDrinkItem(data: CreateDrinkItemDTO): Promise<DrinkItemDTO>;
  updateDrinkItem(id: number, data: UpdateDrinkItemDTO): Promise<DrinkItemDTO>;
  deleteDrinkItem(id: number): Promise<void>;
}
