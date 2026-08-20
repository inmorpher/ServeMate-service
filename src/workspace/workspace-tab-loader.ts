import { inject, injectable } from 'inversify';

import { IDrinkItemsService } from '../drink-items/drink-items.service.interface';
import { searchDrinkItemsSchema } from '../drink-items/dto/drink-query.dto';
import { HTTPError } from '../errors/http-error.class';
import { searchFoodItemsSchema } from '../food-items/dto/food-query.dto';
import { IFoodItemsService } from '../food-items/food-items.service.interface';
import { OrderQuerySchema } from '../orders/dto/order-query.dto';
import { IOrdersService } from '../orders/orders.service.interface';
import { PaymentSearchSchema } from '../payments/dto/payment-base.dto';
import { IPaymentsService } from '../payments/payments.service.interface';
import { ReservationQuerySchema } from '../reservations/dto/reservation-query.dto';
import { IReservationsService } from '../reservations/reservations.service.interface';
import { TableQuerySchema } from '../tables/dto/table-query.dto';
import { ITablesService } from '../tables/tables.service.interface';
import { TYPES } from '../types';
import { UserQuerySchema } from '../users/dto/user-query.dto';
import { IUsersService } from '../users/users.service.interface';
import { WorkspaceTab } from './dto/workspace-tab.dto';

@injectable()
export class WorkspaceTabLoader {
  private readonly tabLoaders: Record<
    string,
    (state: Record<string, unknown>) => Promise<unknown>
  > = {
    users: async state => {
      const query = UserQuerySchema.parse(state);
      return this.usersService.findUsers(query);
    },
    orders: async state => {
      const query = OrderQuerySchema.parse(state);
      return this.ordersService.findOrders(query);
    },
    tables: async state => {
      const query = TableQuerySchema.parse(state);
      return this.tablesService.findTables(query);
    },
    payments: async state => {
      const query = PaymentSearchSchema.parse(state);
      return this.paymentsService.findPayments(query);
    },
    'food-items': async state => {
      const query = searchFoodItemsSchema.parse(state);
      return this.foodItemsService.findFoodItems(query);
    },
    foods: async state => {
      const query = searchFoodItemsSchema.parse(state);
      return this.foodItemsService.findFoodItems(query);
    },
    'drink-items': async state => {
      const query = searchDrinkItemsSchema.parse(state);
      return this.drinkItemsService.findDrinkItems(query);
    },
    drinks: async state => {
      const query = searchDrinkItemsSchema.parse(state);
      return this.drinkItemsService.findDrinkItems(query);
    },
    reservations: async state => {
      const query = ReservationQuerySchema.parse(state);
      return this.reservationsService.findReservations(query);
    },
    user: async state =>
      this.usersService.findUserById(this.getEntityId(state)),
    order: async state =>
      this.ordersService.findOrderById(this.getEntityId(state)),
    table: async state =>
      this.tablesService.findTableById(this.getEntityId(state)),
    payment: async state =>
      this.paymentsService.findPaymentById(this.getEntityId(state)),
    food: async state =>
      this.foodItemsService.findFoodItemById(this.getEntityId(state)),
    'food-item': async state =>
      this.foodItemsService.findFoodItemById(this.getEntityId(state)),
    drink: async state =>
      this.drinkItemsService.findDrinkItemById(this.getEntityId(state)),
    'drink-item': async state =>
      this.drinkItemsService.findDrinkItemById(this.getEntityId(state)),
    reservation: async state =>
      this.reservationsService.findReservationById(this.getEntityId(state)),
  };

  constructor(
    @inject(TYPES.OrdersService)
    private readonly ordersService: IOrdersService,
    @inject(TYPES.TablesService)
    private readonly tablesService: ITablesService,
    @inject(TYPES.UsersService)
    private readonly usersService: IUsersService,
    @inject(TYPES.PaymentsService)
    private readonly paymentsService: IPaymentsService,
    @inject(TYPES.FoodItemsService)
    private readonly foodItemsService: IFoodItemsService,
    @inject(TYPES.DrinkItemsService)
    private readonly drinkItemsService: IDrinkItemsService,
    @inject(TYPES.ReservationsService)
    private readonly reservationsService: IReservationsService
  ) {}

  async load(activeTab: WorkspaceTab): Promise<unknown | null> {
    const loader = this.tabLoaders[activeTab.type];

    if (!loader) {
      return null;
    }

    return loader(activeTab.state ?? {});
  }

  private getEntityId(state: Record<string, unknown>): number {
    const id = state.id;

    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      throw new HTTPError(
        400,
        'WorkspaceTabLoader',
        'A positive numeric id is required for a single entity tab'
      );
    }

    return id;
  }
}
