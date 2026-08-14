import {
  createDrinkItemSchema,
  searchDrinkItemsSchema,
} from '../../drink-items/dto';

describe('Drink item DTOs', () => {
  it('applies create and query defaults', () => {
    expect(
      createDrinkItemSchema.parse({
        name: 'Tea',
        price: 5,
        description: 'Hot tea',
        category: 'TEA',
        volume: 250,
        alcoholPercentage: 0,
        isCarbonated: false,
        tempriture: 'HOT',
      })
    ).toMatchObject({
      name: 'Tea',
      price: 5,
      isAvailable: true,
    });
    expect(searchDrinkItemsSchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 10,
      sortBy: 'id',
      sortOrder: 'asc',
    });
  });

  it('rejects invalid query sorting', () => {
    expect(() => searchDrinkItemsSchema.parse({ sortBy: 'unknown' })).toThrow();
  });
});
