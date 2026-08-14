import { DrinkItemsService } from '../../drink-items/drink-items.service';

describe('DrinkItemsService', () => {
  it('does not delete a missing item', async () => {
    const repository = { findById: jest.fn().mockResolvedValue(null) } as any;
    const service = new DrinkItemsService(repository);

    await expect(service.deleteDrinkItem(9)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(repository.findById).toHaveBeenCalledWith(9);
  });

  it('delegates queries to the repository', async () => {
    const result = {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };
    const repository = { findMany: jest.fn().mockResolvedValue(result) } as any;
    const service = new DrinkItemsService(repository);

    await expect(service.findDrinkItems({} as any)).resolves.toBe(result);
    expect(repository.findMany).toHaveBeenCalledWith({});
  });
});
