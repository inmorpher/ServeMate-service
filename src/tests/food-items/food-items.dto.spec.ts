import {
  createFoodItemSchema,
  searchFoodItemsSchema,
} from '../../food-items/dto';

describe('Food item DTOs', () => {
  it('applies create and query defaults', () => {
    expect(
      createFoodItemSchema.parse({
        name: 'Soup',
        price: 12,
        description: 'Warm soup',
        category: 'SOUP',
        type: 'MAIN_COURSE',
      })
    ).toMatchObject({
      name: 'Soup',
      price: 12,
      isAvailable: true,
    });
    expect(searchFoodItemsSchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 10,
      sortBy: 'id',
      sortOrder: 'asc',
    });
  });

  it('rejects an invalid price and sort field', () => {
    expect(() =>
      createFoodItemSchema.parse({
        name: 'Soup',
        price: -1,
        description: 'Warm soup',
        category: 'SOUP',
        type: 'MAIN_COURSE',
      })
    ).toThrow();
    expect(() =>
      createFoodItemSchema.parse({
        name: 'Soup',
        price: 12,
        description: 'Warm soup',
        category: 'SOUP',
        type: 'INVALID',
      })
    ).toThrow();
    expect(() => searchFoodItemsSchema.parse({ sortBy: 'unknown' })).toThrow();
  });
});
