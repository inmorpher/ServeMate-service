import { Allergy, OrderState } from '@prisma/client';
import { OrderCreateSchema } from '../../orders/dto/order-create.dto';
import { OrderQuerySchema } from '../../orders/dto/order-query.dto';
import {
  OrderUpdateItemsSchema,
  OrderUpdateSchema,
} from '../../orders/dto/order-update.dto';

describe('Orders DTO schemas', () => {
  it('parses a singular tableNumber query parameter', () => {
    expect(OrderQuerySchema.parse({ tableNumber: '43' })).toEqual(
      expect.objectContaining({ tableNumber: 43 })
    );
  });

  it('parses a comma-separated tableNumbers query parameter', () => {
    expect(OrderQuerySchema.parse({ tableNumbers: '43,44' })).toEqual(
      expect.objectContaining({ tableNumbers: [43, 44] })
    );
  });

  it('normalizes query status and allergies', () => {
    expect(
      OrderQuerySchema.parse({
        status: 'completed',
        allergies: 'gluten,dairy',
      })
    ).toEqual(
      expect.objectContaining({
        status: OrderState.COMPLETED,
        allergies: [Allergy.GLUTEN, Allergy.DAIRY],
      })
    );
  });

  it('rejects an order without food or drink items', () => {
    expect(() =>
      OrderCreateSchema.parse({
        tableNumber: 43,
        guestsCount: 2,
        serverId: 7,
        foodItems: [],
        drinkItems: [],
      })
    ).toThrow();
  });

  it('parses create items without server-owned fields', () => {
    const parsed = OrderCreateSchema.parse({
      tableNumber: 43,
      guestsCount: 1,
      serverId: 7,
      foodItems: [
        {
          guestNumber: 1,
          items: [{ itemId: 100, price: 20 }],
        },
      ],
      drinkItems: [],
    });

    expect(parsed.foodItems[0].items[0]).toEqual(
      expect.objectContaining({
        itemId: 100,
        price: 20,
        discount: 0,
        finalPrice: 0,
        allergies: [],
      })
    );
  });

  it('rejects an empty property update', () => {
    expect(() => OrderUpdateSchema.parse({})).toThrow();
  });

  it('rejects an empty item update', () => {
    expect(() =>
      OrderUpdateItemsSchema.parse({ foodItems: [], drinkItems: [] })
    ).toThrow();
  });
});
