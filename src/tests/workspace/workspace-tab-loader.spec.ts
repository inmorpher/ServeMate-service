import { IDrinkItemsService } from '../../drink-items/drink-items.service.interface';
import { IFoodItemsService } from '../../food-items/food-items.service.interface';
import { IOrdersService } from '../../orders/orders.service.interface';
import { IPaymentsService } from '../../payments/payments.service.interface';
import { IReservationsService } from '../../reservations/reservations.service.interface';
import { ITablesService } from '../../tables/tables.service.interface';
import { IUsersService } from '../../users/users.service.interface';
import { WorkspaceTab } from '../../workspace/dto/workspace-tab.dto';
import { WorkspaceTabLoader } from '../../workspace/workspace-tab-loader';

const services = () => ({
  ordersService: { findOrders: jest.fn(), findOrderById: jest.fn() },
  tablesService: { findTables: jest.fn(), findTableById: jest.fn() },
  usersService: { findUsers: jest.fn(), findUserById: jest.fn() },
  paymentsService: { findPayments: jest.fn(), findPaymentById: jest.fn() },
  foodItemsService: { findFoodItems: jest.fn(), findFoodItemById: jest.fn() },
  drinkItemsService: {
    findDrinkItems: jest.fn(),
    findDrinkItemById: jest.fn(),
  },
  reservationsService: {
    findReservations: jest.fn(),
    findReservationById: jest.fn(),
  },
});

const tab = (type: string, state: Record<string, unknown> = {}): WorkspaceTab =>
  ({
    id: `${type}-tab`,
    title: type,
    type,
    state,
    order: 0,
  }) as WorkspaceTab;

describe('WorkspaceTabLoader', () => {
  it.each([
    ['users', 'findUsers'],
    ['orders', 'findOrders'],
    ['tables', 'findTables'],
    ['payments', 'findPayments'],
    ['food-items', 'findFoodItems'],
    ['foods', 'findFoodItems'],
    ['drink-items', 'findDrinkItems'],
    ['drinks', 'findDrinkItems'],
    ['reservations', 'findReservations'],
  ])('loads the %s list through %s', async (type, method) => {
    const mocks = services();
    const service = new WorkspaceTabLoader(
      mocks.ordersService as unknown as IOrdersService,
      mocks.tablesService as unknown as ITablesService,
      mocks.usersService as unknown as IUsersService,
      mocks.paymentsService as unknown as IPaymentsService,
      mocks.foodItemsService as unknown as IFoodItemsService,
      mocks.drinkItemsService as unknown as IDrinkItemsService,
      mocks.reservationsService as unknown as IReservationsService
    );
    const result = { items: [] };
    const target = (mocks as Record<string, Record<string, jest.Mock>>)[
      method === 'findFoodItems'
        ? 'foodItemsService'
        : method === 'findDrinkItems'
          ? 'drinkItemsService'
          : `${type}Service`
    ];

    target[method].mockResolvedValue(result);

    await expect(service.load(tab(type))).resolves.toBe(result);
    expect(target[method]).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  it.each([
    ['user', 'usersService', 'findUserById'],
    ['order', 'ordersService', 'findOrderById'],
    ['table', 'tablesService', 'findTableById'],
    ['payment', 'paymentsService', 'findPaymentById'],
    ['food', 'foodItemsService', 'findFoodItemById'],
    ['food-item', 'foodItemsService', 'findFoodItemById'],
    ['drink', 'drinkItemsService', 'findDrinkItemById'],
    ['drink-item', 'drinkItemsService', 'findDrinkItemById'],
    ['reservation', 'reservationsService', 'findReservationById'],
  ])('loads the %s entity by id', async (type, serviceName, method) => {
    const mocks = services();
    const service = new WorkspaceTabLoader(
      mocks.ordersService as unknown as IOrdersService,
      mocks.tablesService as unknown as ITablesService,
      mocks.usersService as unknown as IUsersService,
      mocks.paymentsService as unknown as IPaymentsService,
      mocks.foodItemsService as unknown as IFoodItemsService,
      mocks.drinkItemsService as unknown as IDrinkItemsService,
      mocks.reservationsService as unknown as IReservationsService
    );
    const result = { id: 42 };
    const target = mocks[serviceName as keyof typeof mocks] as Record<
      string,
      jest.Mock
    >;
    target[method].mockResolvedValue(result);

    await expect(service.load(tab(type, { id: 42 }))).resolves.toBe(result);
    expect(target[method]).toHaveBeenCalledWith(42);
  });

  it('rejects an invalid entity id', async () => {
    const mocks = services();
    const service = new WorkspaceTabLoader(
      mocks.ordersService as unknown as IOrdersService,
      mocks.tablesService as unknown as ITablesService,
      mocks.usersService as unknown as IUsersService,
      mocks.paymentsService as unknown as IPaymentsService,
      mocks.foodItemsService as unknown as IFoodItemsService,
      mocks.drinkItemsService as unknown as IDrinkItemsService,
      mocks.reservationsService as unknown as IReservationsService
    );

    await expect(service.load(tab('user', { id: '42' }))).rejects.toMatchObject(
      {
        statusCode: 400,
      }
    );
  });

  it('returns null for an unsupported tab type', async () => {
    const mocks = services();
    const service = new WorkspaceTabLoader(
      mocks.ordersService as unknown as IOrdersService,
      mocks.tablesService as unknown as ITablesService,
      mocks.usersService as unknown as IUsersService,
      mocks.paymentsService as unknown as IPaymentsService,
      mocks.foodItemsService as unknown as IFoodItemsService,
      mocks.drinkItemsService as unknown as IDrinkItemsService,
      mocks.reservationsService as unknown as IReservationsService
    );

    await expect(service.load(tab('dashboard'))).resolves.toBeNull();
  });
});
