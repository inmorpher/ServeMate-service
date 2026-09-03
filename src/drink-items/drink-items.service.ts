import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../common/base.service';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import { publishRealtimeEvent } from '../websocket/realtime-event';
import { IWebSocketService } from '../websocket/websocket.service.interface';
import { IDrinkItemsRepository } from './drink-items.repository.interface';
import { IDrinkItemsService } from './drink-items.service.interface';
import {
  CreateDrinkItemDTO,
  DrinkItemDTO,
  DrinkItemsListDTO,
  SearchDrinkItemsDTO,
  UpdateDrinkItemDTO,
} from './dto';

@injectable()
export class DrinkItemsService
  extends BaseService
  implements IDrinkItemsService
{
  protected serviceName = 'DrinkItemsService';
  constructor(
    @inject(TYPES.DrinkItemsRepository)
    private repository: IDrinkItemsRepository,
    @inject(TYPES.WebSocketService)
    private readonly realtimeGateway?: IWebSocketService
  ) {
    super();
  }
  async findDrinkItems(
    criteria: SearchDrinkItemsDTO
  ): Promise<DrinkItemsListDTO> {
    try {
      return await this.repository.findMany(criteria);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async findDrinkItemById(id: number): Promise<DrinkItemDTO | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async createDrinkItem(data: CreateDrinkItemDTO): Promise<DrinkItemDTO> {
    try {
      const item = await this.repository.create(data);
      publishRealtimeEvent(
        this.realtimeGateway,
        'drink-items',
        'created',
        item.id,
        item
      );
      return item;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async updateDrinkItem(
    id: number,
    data: UpdateDrinkItemDTO
  ): Promise<DrinkItemDTO> {
    try {
      if (!(await this.repository.findById(id)))
        throw new HTTPError(404, this.serviceName, 'Drink Item not found');
      const item = await this.repository.update(id, data);
      publishRealtimeEvent(
        this.realtimeGateway,
        'drink-items',
        'updated',
        item.id,
        item
      );
      return item;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async deleteDrinkItem(id: number): Promise<void> {
    try {
      if (!(await this.repository.findById(id)))
        throw new HTTPError(404, this.serviceName, 'Drink Item not found');
      await this.repository.delete(id);
      publishRealtimeEvent(this.realtimeGateway, 'drink-items', 'deleted', id);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
