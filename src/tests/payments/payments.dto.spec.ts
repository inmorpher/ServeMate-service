import { PaymentCreateSchema } from '../../payments/dto';

describe('Payment DTOs', () => {
  it('defaults item selections to empty arrays', () => {
    expect(PaymentCreateSchema.parse({})).toEqual({
      foodItems: [],
      drinkItems: [],
    });
  });

  it('coerces item ids and rejects non-positive ids', () => {
    expect(
      PaymentCreateSchema.parse({ foodItems: ['2'], drinkItems: [3] })
    ).toEqual({
      foodItems: [2],
      drinkItems: [3],
    });
    expect(() => PaymentCreateSchema.parse({ foodItems: [0] })).toThrow();
  });
});
