import { FoodItemsService } from '../../food-items/food-items.service';

describe('FoodItemsService', () => {
  it('does not update a missing item', async () => {
    const repository = { findById: jest.fn().mockResolvedValue(null) } as any;
    const service = new FoodItemsService(repository);

    await expect(service.updateFoodItem(7, {} as any)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(repository.findById).toHaveBeenCalledWith(7);
  });

  it('delegates creation to the repository', async () => {
    const item = { id: 1, name: 'Soup' };
    const repository = { create: jest.fn().mockResolvedValue(item) } as any;
    const service = new FoodItemsService(repository);

    await expect(service.createFoodItem({} as any)).resolves.toBe(item);
    expect(repository.create).toHaveBeenCalledWith({});
  });
});
