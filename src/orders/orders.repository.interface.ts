import { Allergy, OrderState, PaymentState } from '@prisma/client';

import {
  OrderMetaDto,
  OrderQuery,
  OrderResponseDto,
  OrderSearchResultDto,
  OrderUpdate,
} from './dto';

export interface OrderItemCreateData {
  guestNumber: number;
  itemId: number;
  price: number;
  discount: number;
  finalPrice: number;
  specialRequest: string | null;
  allergies: Allergy[];
  printed?: boolean;
  fired?: boolean;
  paymentStatus?: PaymentState;
}

export interface OrderCreateData {
  tableNumber: number;
  guestsCount: number;
  serverId: number;
  status: OrderState;
  comments?: string | null;
  discount: number;
  totalAmount: number;
  foodItems: OrderItemCreateData[];
  drinkItems: OrderItemCreateData[];
}

export interface OrderItemsUpdateData {
  totalAmount: number;
  foodItems: OrderItemCreateData[];
  drinkItems: OrderItemCreateData[];
}

export interface IOrdersRepository {
  findOrders(criteria: OrderQuery): Promise<OrderSearchResultDto>;
  findById(orderId: number): Promise<OrderResponseDto | null>;
  getMeta(criteria: OrderQuery): Promise<OrderMetaDto>;

  create(data: OrderCreateData): Promise<OrderResponseDto>;

  update(orderId: number, data: OrderUpdate): Promise<OrderResponseDto>;

  updateItems(
    orderId: number,
    data: OrderItemsUpdateData
  ): Promise<OrderResponseDto>;

  printItems(orderId: number, ids: number[]): Promise<void>;
  callItems(orderId: number, ids: number[]): Promise<void>;
  delete(orderId: number): Promise<void>;
}
