import { OrderState } from '@prisma/client';
import { OrdersController } from '../../orders/orders.controller';
import { IOrdersService } from '../../orders/orders.service.interface';

const serviceMock = (): jest.Mocked<IOrdersService> =>
  ({
    findOrders: jest.fn(),
    findOrderById: jest.fn(),
    getOrderMeta: jest.fn(),
    createOrder: jest.fn(),
    updateOrder: jest.fn(),
    updateOrderItems: jest.fn(),
    printOrderItems: jest.fn(),
    callOrderItems: jest.fn(),
    deleteOrder: jest.fn(),
  }) as jest.Mocked<IOrdersService>;

const responseMock = () =>
  ({
    type: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  }) as any;

describe('OrdersController', () => {
  let service: jest.Mocked<IOrdersService>;
  let controller: OrdersController;
  let next: jest.Mock;

  beforeEach(() => {
    service = serviceMock();
    controller = new OrdersController({} as any, service);
    next = jest.fn();
  });

  it('passes validated query to findOrders and returns 200', async () => {
    const result = { orders: [] } as any;
    service.findOrders.mockResolvedValue(result);
    const response = responseMock();
    const criteria = {
      tableNumber: 43,
      page: 1,
      pageSize: 10,
      sortBy: 'id',
      sortOrder: 'asc',
    } as any;

    await controller.findOrders(
      { validated: { query: criteria } } as any,
      response,
      next
    );

    expect(service.findOrders).toHaveBeenCalledWith(criteria);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(result);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 when an order is not found', async () => {
    service.findOrderById.mockResolvedValue(null);
    const response = responseMock();

    await controller.findOrderById(
      { validated: { params: { id: 999 } } } as any,
      response,
      next
    );

    expect(service.findOrderById).toHaveBeenCalledWith(999);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Order not found',
      error: 'Not Found',
    });
  });

  it('passes validated body and params to updateOrder', async () => {
    const response = responseMock();
    const update = { status: OrderState.SERVED };

    await controller.updateOrder(
      { validated: { params: { id: 10 }, body: update } } as any,
      response,
      next
    );

    expect(service.updateOrder).toHaveBeenCalledWith(10, update);
    expect(response.sendStatus).toHaveBeenCalledWith(204);
  });

  it('passes item ids to printOrderItems', async () => {
    const response = responseMock();

    await controller.printOrderItems(
      { validated: { params: { id: 10 }, body: { ids: [1, 2] } } } as any,
      response,
      next
    );

    expect(service.printOrderItems).toHaveBeenCalledWith(10, [1, 2]);
    expect(response.sendStatus).toHaveBeenCalledWith(204);
  });
});
