import {
  DrinkCategory,
  FoodCategory,
  FoodType,
  PaymentMethod,
  PaymentState,
  ReservationStatus,
  TableCondition,
  UserRole,
} from '@prisma/client';
import { DrinkItemsRepository } from '../../drink-items/drink-items.repository';
import { FoodItemsRepository } from '../../food-items/food-items.repository';
import { PaymentsRepository } from '../../payments/payments.repository';
import { ReservationsRepository } from '../../reservations/reservations.repository';
import { TablesRepository } from '../../tables/tables.repository';
import { UsersRepository } from '../../users/users.repository';

describe('metadata repositories', () => {
  it('returns user roles, active states, and creation range', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const prisma = {
      user: {
        aggregate: jest.fn().mockResolvedValue({
          _min: { createdAt },
          _max: { createdAt },
        }),
      },
    } as any;

    await expect(new UsersRepository(prisma).getMeta()).resolves.toEqual({
      roles: Object.values(UserRole),
      activeStates: [true, false],
      createdAtRange: {
        min: createdAt.toISOString(),
        max: createdAt.toISOString(),
      },
    });
  });

  it('returns table statuses, numbers, and capacity range', async () => {
    const prisma = {
      table: {
        aggregate: jest.fn().mockResolvedValue({
          _min: { capacity: 2 },
          _max: { capacity: 8 },
        }),
        findMany: jest
          .fn()
          .mockResolvedValue([{ tableNumber: 2 }, { tableNumber: 9 }]),
      },
    } as any;

    await expect(new TablesRepository(prisma).getMeta()).resolves.toEqual({
      statuses: Object.values(TableCondition),
      occupiedStates: [true, false],
      tableNumbers: [2, 9],
      capacityRange: { min: 2, max: 8 },
    });
  });

  it('returns reservation statuses, available tables, and ranges', async () => {
    const time = new Date('2026-02-01T12:00:00.000Z');
    const tables = [{ id: 4, tableNumber: 12 }];
    const prisma = {
      reservation: {
        aggregate: jest.fn().mockResolvedValue({
          _min: { guestsCount: 2, time },
          _max: { guestsCount: 6, time },
        }),
      },
      table: { findMany: jest.fn().mockResolvedValue(tables) },
    } as any;

    await expect(new ReservationsRepository(prisma).getMeta()).resolves.toEqual(
      {
        statuses: Object.values(ReservationStatus),
        tables,
        guestsCountRange: { min: 2, max: 6 },
        timeRange: { min: time.toISOString(), max: time.toISOString() },
      }
    );
  });

  it('returns payment statuses, methods, order IDs, and amount range', async () => {
    const prisma = {
      payment: {
        aggregate: jest.fn().mockResolvedValue({
          _min: { totalAmount: 2.2 },
          _max: { totalAmount: 19.8 },
        }),
        findMany: jest.fn().mockResolvedValue([{ orderId: 7 }]),
      },
    } as any;

    await expect(new PaymentsRepository(prisma).getMeta()).resolves.toEqual({
      statuses: Object.values(PaymentState),
      methods: Object.values(PaymentMethod),
      orderIds: [7],
      totalAmountRange: { min: 2, max: 20 },
    });
  });

  it('returns food enums, unique ingredients, and price range', async () => {
    const prisma = {
      foodItem: {
        aggregate: jest.fn().mockResolvedValue({
          _min: { price: 2.2 },
          _max: { price: 19.8 },
        }),
        findMany: jest
          .fn()
          .mockResolvedValue([
            { ingredients: ['salt', 'pepper'] },
            { ingredients: ['salt', 'oil'] },
          ]),
      },
    } as any;

    await expect(new FoodItemsRepository(prisma).getMeta()).resolves.toEqual({
      categories: Object.values(FoodCategory),
      types: Object.values(FoodType),
      ingredients: ['oil', 'pepper', 'salt'],
      availabilityStates: [true, false],
      booleanFilterValues: [true, false],
      priceRange: { min: 2, max: 20 },
    });
  });

  it('returns drink enums, unique ingredients, and numeric ranges', async () => {
    const prisma = {
      drinkItem: {
        aggregate: jest.fn().mockResolvedValue({
          _min: { price: 2.2, volume: 250 },
          _max: { price: 19.8, volume: 750 },
        }),
        findMany: jest
          .fn()
          .mockResolvedValue([
            { ingredients: ['water', 'lemon'] },
            { ingredients: ['water', 'mint'] },
          ]),
      },
    } as any;

    await expect(new DrinkItemsRepository(prisma).getMeta()).resolves.toEqual({
      categories: Object.values(DrinkCategory),
      ingredients: ['lemon', 'mint', 'water'],
      availabilityStates: [true, false],
      volumeRange: { min: 250, max: 750 },
      priceRange: { min: 2, max: 20 },
    });
  });
});
