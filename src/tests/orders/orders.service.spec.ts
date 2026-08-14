import { Allergy, OrderState, PaymentState } from '@prisma/client';
import { HTTPError } from '../../errors/http-error.class';
import {
  OrderCreate,
  OrderResponseDto,
  OrderUpdateItems,
} from '../../orders/dto';
import { IOrdersRepository } from '../../orders/orders.repository.interface';
import { OrdersService } from '../../orders/orders.service';

const repositoryMock = (): jest.Mocked<IOrdersRepository> =>
  ({
    findOrders: jest.fn(),
    findById: jest.fn(),
    getMeta: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateItems: jest.fn(),
    printItems: jest.fn(),
    callItems: jest.fn(),
    delete: jest.fn(),
  }) as jest.Mocked<IOrdersRepository>;

const responseOrder = (
  overrides: Partial<OrderResponseDto> = {}
): OrderResponseDto => ({
  id: 10,
  tableNumber: 43,
  guestsCount: 2,
  orderTime: new Date('2026-01-01T10:00:00.000Z'),
  updatedAt: new Date('2026-01-01T10:00:00.000Z'),
  serverId: 7,
  status: OrderState.RECEIVED,
  comments: null,
  completionTime: null,
  totalAmount: 18,
  discount: 10,
  tip: 0,
  shiftId: null,
  allergies: [],
  server: { id: 7, name: 'Server' },
  foodItems: [
    {
      guestNumber: 1,
      items: [
        {
          id: 1,
          itemId: 100,
          guestNumber: 1,
          allergies: [Allergy.GLUTEN],
          price: 10,
          discount: 0,
          finalPrice: 10,
          printed: false,
          fired: false,
          paymentStatus: PaymentState.NONE,
          specialRequest: null,
          name: 'Soup',
        },
      ],
    },
  ],
  drinkItems: [],
  ...overrides,
});

describe('OrdersService', () => {
  let repository: jest.Mocked<IOrdersRepository>;
  let service: OrdersService;

  beforeEach(() => {
    repository = repositoryMock();
    service = new OrdersService(repository);
  });

  it('creates an order with flattened items and discounted total', async () => {
    const data: OrderCreate = {
      tableNumber: 43,
      guestsCount: 2,
      serverId: 7,
      status: OrderState.RECEIVED,
      comments: null,
      discount: 10,
      allergies: [],
      foodItems: [
        {
          guestNumber: 2,
          items: [
            {
              itemId: 100,
              price: 20,
              discount: 0,
              finalPrice: 20,
              specialRequest: null,
              allergies: [],
            },
          ],
        },
      ],
      drinkItems: [],
    };
    const created = responseOrder({ totalAmount: 18 });
    repository.create.mockResolvedValue(created);

    await expect(service.createOrder(data)).resolves.toBe(created);

    expect(repository.create).toHaveBeenCalledWith({
      tableNumber: 43,
      guestsCount: 2,
      serverId: 7,
      status: OrderState.RECEIVED,
      comments: null,
      discount: 10,
      totalAmount: 18,
      foodItems: [
        {
          itemId: 100,
          price: 20,
          discount: 0,
          finalPrice: 20,
          specialRequest: null,
          allergies: [],
          guestNumber: 2,
        },
      ],
      drinkItems: [],
    });
  });

  it('updates order properties through the repository', async () => {
    const data = { status: OrderState.SERVED };
    const updated = responseOrder({ status: OrderState.SERVED });
    repository.update.mockResolvedValue(updated);

    await expect(service.updateOrder(10, data)).resolves.toBe(updated);
    expect(repository.update).toHaveBeenCalledWith(10, data);
  });

  it('merges new items and recalculates the discounted total', async () => {
    const data: OrderUpdateItems = {
      foodItems: [
        {
          guestNumber: 2,
          items: [
            {
              itemId: 101,
              price: 8,
              discount: 0,
              finalPrice: 8,
              specialRequest: 'No salt',
              allergies: [],
            },
          ],
        },
      ],
      drinkItems: [],
    };
    const updated = responseOrder({ totalAmount: 16.2 });
    repository.findById.mockResolvedValue(responseOrder());
    repository.updateItems.mockResolvedValue(updated);

    await expect(service.updateOrderItems(10, data)).resolves.toBe(updated);

    expect(repository.updateItems).toHaveBeenCalledWith(10, {
      totalAmount: 16.2,
      foodItems: [
        expect.objectContaining({ id: 1, guestNumber: 1, finalPrice: 10 }),
        expect.objectContaining({
          itemId: 101,
          guestNumber: 2,
          finalPrice: 8,
          specialRequest: 'No salt',
        }),
      ],
      drinkItems: [],
    });
  });

  it('throws 404 when updating items for a missing order', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.updateOrderItems(999, { foodItems: [], drinkItems: [] })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.updateItems).not.toHaveBeenCalled();
  });

  it('delegates print, call and delete operations', async () => {
    await expect(service.printOrderItems(10, [1, 2])).resolves.toBe(
      'Items have been printed'
    );
    await expect(service.callOrderItems(10, [1, 2])).resolves.toBe(
      'Items 1, 2 have been called'
    );
    await expect(service.deleteOrder(10)).resolves.toBeUndefined();

    expect(repository.printItems).toHaveBeenCalledWith(10, [1, 2]);
    expect(repository.callItems).toHaveBeenCalledWith(10, [1, 2]);
    expect(repository.delete).toHaveBeenCalledWith(10);
  });

  it('converts repository failures into HTTPError', async () => {
    repository.findOrders.mockRejectedValue(new Error('database down'));

    await expect(service.findOrders({} as never)).rejects.toBeInstanceOf(
      HTTPError
    );
  });
});
