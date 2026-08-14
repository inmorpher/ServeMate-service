import { Allergy, OrderState, PaymentState } from '@prisma/client';
import { HTTPError } from '../../errors/http-error.class';
import { OrdersRepository } from '../../orders/orders.repository';
import { OrderCreateData } from '../../orders/orders.repository.interface';

const detailOrder = {
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
  server: { id: 7, name: 'Server' },
  foodItems: [
    {
      id: 1,
      itemId: 100,
      guestNumber: 1,
      price: 20,
      discount: 0,
      finalPrice: 20,
      printed: false,
      fired: false,
      paymentStatus: PaymentState.NONE,
      specialRequest: null,
      foodItem: { id: 100, name: 'Soup' },
      allergies: [{ allergy: Allergy.GLUTEN }],
    },
  ],
  drinkItems: [],
};

const createData: OrderCreateData = {
  tableNumber: 43,
  guestsCount: 2,
  serverId: 7,
  status: OrderState.RECEIVED,
  comments: null,
  discount: 10,
  totalAmount: 18,
  foodItems: [
    {
      guestNumber: 1,
      itemId: 100,
      price: 20,
      discount: 0,
      finalPrice: 20,
      specialRequest: null,
      allergies: [Allergy.GLUTEN],
    },
  ],
  drinkItems: [],
};

const createPrismaMock = () => {
  const prisma: any = {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orderFoodItem: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    orderDrinkItem: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation((callback: unknown) =>
    typeof callback === 'function'
      ? callback(prisma)
      : Promise.all(callback as any)
  );

  return prisma;
};

describe('OrdersRepository', () => {
  it('maps application order data to Prisma nested create input', async () => {
    const prisma = createPrismaMock();
    prisma.order.create.mockResolvedValue(detailOrder);
    const repository = new OrdersRepository(prisma);

    await repository.create(createData);

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          server: { connect: { id: 7 } },
          table: { connect: { tableNumber: 43 } },
          totalAmount: 18,
          foodItems: {
            create: [
              expect.objectContaining({
                guestNumber: 1,
                itemId: 100,
                allergies: { create: [{ allergy: Allergy.GLUTEN }] },
              }),
            ],
          },
          drinkItems: { create: [] },
        }),
      })
    );
  });

  it('adds tableNumber to the order search filter', async () => {
    const prisma = createPrismaMock();
    prisma.order.findMany.mockResolvedValue([]);
    prisma.order.count.mockResolvedValue(0);
    prisma.order.aggregate.mockResolvedValue({
      _min: { totalAmount: null, orderTime: null },
      _max: { totalAmount: null, orderTime: null },
    });
    const repository = new OrdersRepository(prisma);

    await repository.findOrders({
      tableNumber: 43,
      tableNumbers: undefined,
      page: 1,
      pageSize: 10,
      sortBy: 'id',
      sortOrder: 'asc',
    } as any);

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tableNumber: 43 } })
    );
  });

  it('maps property updates and completion time to Prisma', async () => {
    const prisma = createPrismaMock();
    prisma.order.update.mockResolvedValue(detailOrder);
    const repository = new OrdersRepository(prisma);

    await repository.update(10, {
      tableNumber: 44,
      status: OrderState.COMPLETED,
      comments: 'Done',
    });

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: expect.objectContaining({
          table: { connect: { tableNumber: 44 } },
          status: OrderState.COMPLETED,
          comments: 'Done',
          completionTime: expect.any(Date),
        }),
      })
    );
  });

  it('replaces order items and updates total amount', async () => {
    const prisma = createPrismaMock();
    prisma.order.update.mockResolvedValue(detailOrder);
    const repository = new OrdersRepository(prisma);

    await repository.updateItems(10, {
      totalAmount: 25,
      foodItems: createData.foodItems,
      drinkItems: [],
    });

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: expect.objectContaining({
          totalAmount: 25,
          foodItems: expect.objectContaining({
            deleteMany: {},
            create: expect.any(Array),
          }),
          drinkItems: expect.objectContaining({ deleteMany: {}, create: [] }),
        }),
      })
    );
  });

  it('prints only items belonging to the order', async () => {
    const prisma = createPrismaMock();
    prisma.orderFoodItem.findMany.mockResolvedValue([
      { id: 1, printed: false },
    ]);
    prisma.orderDrinkItem.findMany.mockResolvedValue([]);
    const repository = new OrdersRepository(prisma);

    await repository.printItems(10, [1]);

    expect(prisma.orderFoodItem.updateMany).toHaveBeenCalledWith({
      where: { orderId: 10, id: { in: [1] } },
      data: { printed: true },
    });
  });

  it('rejects calling an item before printing it', async () => {
    const prisma = createPrismaMock();
    prisma.orderFoodItem.findMany.mockResolvedValue([
      { id: 1, printed: false, fired: false },
    ]);
    prisma.orderDrinkItem.findMany.mockResolvedValue([]);
    const repository = new OrdersRepository(prisma);

    await expect(repository.callItems(10, [1])).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects deletion when the order has payments', async () => {
    const prisma = createPrismaMock();
    prisma.order.findUnique.mockResolvedValue({
      id: 10,
      payments: [{ id: 50 }],
      foodItems: [],
      drinkItems: [],
    });
    const repository = new OrdersRepository(prisma);

    await expect(repository.delete(10)).rejects.toBeInstanceOf(HTTPError);
    expect(prisma.order.delete).not.toHaveBeenCalled();
  });
});
