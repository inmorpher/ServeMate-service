import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../common/base.service';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import {
  CreateFoodItemDTO,
  FoodItemDTO,
  FoodItemsListDTO,
  SearchFoodItemsDTO,
  UpdateFoodItemDTO,
} from './dto';
import { IFoodItemsRepository } from './food-items.repository.interface';
import { IFoodItemsService } from './food-items.service.interface';

@injectable()
export class FoodItemsService extends BaseService implements IFoodItemsService {
  protected serviceName = 'FoodItemsService';
  constructor(
    @inject(TYPES.FoodItemsRepository) private repository: IFoodItemsRepository
  ) {
    super();
  }
  async findFoodItems(criteria: SearchFoodItemsDTO): Promise<FoodItemsListDTO> {
    try {
      return await this.repository.findMany(criteria);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async findFoodItemById(id: number): Promise<FoodItemDTO | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async createFoodItem(data: CreateFoodItemDTO): Promise<FoodItemDTO> {
    try {
      return await this.repository.create(data);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async updateFoodItem(
    id: number,
    data: UpdateFoodItemDTO
  ): Promise<FoodItemDTO> {
    try {
      if (!(await this.repository.findById(id)))
        throw new HTTPError(404, this.serviceName, 'Food Item not found');
      return await this.repository.update(id, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async deleteFoodItem(id: number): Promise<void> {
    try {
      if (!(await this.repository.findById(id)))
        throw new HTTPError(404, this.serviceName, 'Food Item not found');
      await this.repository.delete(id);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
