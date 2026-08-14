import {
  OrderCreate,
  OrderMetaDto,
  OrderQuery,
  OrderResponseDto,
  OrderSearchResultDto,
  OrderUpdate,
  OrderUpdateItems,
} from './dto';

export interface IOrdersService {
  findOrders(criteria: OrderQuery): Promise<OrderSearchResultDto>;
  findOrderById(orderId: number): Promise<OrderResponseDto | null>;
  getOrderMeta(criteria: OrderQuery): Promise<OrderMetaDto>;
  createOrder(data: OrderCreate): Promise<OrderResponseDto>;
  updateOrder(orderId: number, data: OrderUpdate): Promise<OrderResponseDto>;
  updateOrderItems(
    orderId: number,
    data: OrderUpdateItems
  ): Promise<OrderResponseDto>;
  printOrderItems(orderId: number, ids: number[]): Promise<string>;
  callOrderItems(orderId: number, ids: number[]): Promise<string>;
  deleteOrder(orderId: number): Promise<void>;
}
