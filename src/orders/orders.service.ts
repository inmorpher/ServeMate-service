import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../common/base.service';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import { publishRealtimeEvent } from '../websocket/realtime-event';
import { IWebSocketService } from '../websocket/websocket.service.interface';
import {
  OrderCreate,
  OrderMetaDto,
  OrderQuery,
  OrderResponseDto,
  OrderSearchResultDto,
  OrderUpdate,
  OrderUpdateItems,
} from './dto';
import { IOrdersRepository } from './orders.repository.interface';
import { IOrdersService } from './orders.service.interface';

@injectable()
export class OrdersService extends BaseService implements IOrdersService {
  protected serviceName = 'OrdersService';

  constructor(
    @inject(TYPES.OrdersRepository) private ordersRepository: IOrdersRepository,
    @inject(TYPES.WebSocketService)
    private readonly realtimeGateway?: IWebSocketService
  ) {
    super();
  }

  async findOrders(criteria: OrderQuery): Promise<OrderSearchResultDto> {
    try {
      return await this.ordersRepository.findOrders(criteria);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async findOrderById(orderId: number): Promise<OrderResponseDto | null> {
    try {
      return await this.ordersRepository.findById(orderId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getOrderMeta(criteria: OrderQuery): Promise<OrderMetaDto> {
    try {
      return await this.ordersRepository.getMeta(criteria);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createOrder(data: OrderCreate): Promise<OrderResponseDto> {
    try {
      const subtotal = [...data.foodItems, ...data.drinkItems]
        .flatMap(guest => guest.items)
        .reduce((sum, item) => sum + item.finalPrice, 0);
      const totalAmount = Number(
        (subtotal * (1 - data.discount / 100)).toFixed(2)
      );

      const order = await this.ordersRepository.create({
        tableNumber: data.tableNumber,
        guestsCount: data.guestsCount,
        serverId: data.serverId,
        status: data.status,
        comments: data.comments,
        discount: data.discount,
        totalAmount,
        foodItems: data.foodItems.flatMap(guest =>
          guest.items.map(item => ({
            ...item,
            guestNumber: guest.guestNumber,
          }))
        ),
        drinkItems: data.drinkItems.flatMap(guest =>
          guest.items.map(item => ({
            ...item,
            guestNumber: guest.guestNumber,
          }))
        ),
      });
      publishRealtimeEvent(
        this.realtimeGateway,
        'orders',
        'created',
        order.id,
        order
      );
      return order;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateOrder(
    orderId: number,
    data: OrderUpdate
  ): Promise<OrderResponseDto> {
    try {
      const order = await this.ordersRepository.update(orderId, data);
      publishRealtimeEvent(
        this.realtimeGateway,
        'orders',
        'updated',
        order.id,
        order
      );
      return order;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateOrderItems(
    orderId: number,
    data: OrderUpdateItems
  ): Promise<OrderResponseDto> {
    try {
      const currentOrder = await this.ordersRepository.findById(orderId);

      if (!currentOrder) {
        throw new HTTPError(
          404,
          this.serviceName,
          'Order not found',
          `/orders/${orderId}`
        );
      }

      const foodItems = [
        ...currentOrder.foodItems.flatMap(guest => guest.items),
        ...data.foodItems.flatMap(guest =>
          guest.items.map(item => ({
            ...item,
            guestNumber: guest.guestNumber,
          }))
        ),
      ];
      const drinkItems = [
        ...currentOrder.drinkItems.flatMap(guest => guest.items),
        ...data.drinkItems.flatMap(guest =>
          guest.items.map(item => ({
            ...item,
            guestNumber: guest.guestNumber,
          }))
        ),
      ];

      const subtotal = [...foodItems, ...drinkItems].reduce(
        (sum, item) => sum + item.finalPrice,
        0
      );
      const totalAmount = Number(
        (subtotal * (1 - currentOrder.discount / 100)).toFixed(2)
      );

      const order = await this.ordersRepository.updateItems(orderId, {
        totalAmount,
        foodItems,
        drinkItems,
      });
      publishRealtimeEvent(
        this.realtimeGateway,
        'orders',
        'items_updated',
        order.id,
        order
      );
      return order;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async printOrderItems(orderId: number, ids: number[]): Promise<string> {
    try {
      await this.ordersRepository.printItems(orderId, ids);
      publishRealtimeEvent(
        this.realtimeGateway,
        'orders',
        'items_printed',
        orderId,
        {
          itemIds: ids,
        }
      );
      return 'Items have been printed';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async callOrderItems(orderId: number, ids: number[]): Promise<string> {
    try {
      await this.ordersRepository.callItems(orderId, ids);
      publishRealtimeEvent(
        this.realtimeGateway,
        'orders',
        'items_called',
        orderId,
        {
          itemIds: ids,
        }
      );
      return `Items ${ids.join(', ')} have been called`;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteOrder(orderId: number): Promise<void> {
    try {
      await this.ordersRepository.delete(orderId);
      publishRealtimeEvent(this.realtimeGateway, 'orders', 'deleted', orderId);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
