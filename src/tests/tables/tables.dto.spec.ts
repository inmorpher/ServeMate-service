import { TableCondition } from '@prisma/client';
import {
  TableCreateSchema,
  TableQuerySchema,
  TableUpdateSchema,
} from '../../tables/dto';

describe('Table DTOs', () => {
  it('applies defaults for table creation and queries', () => {
    expect(
      TableCreateSchema.parse({ tableNumber: '4', capacity: '2' })
    ).toEqual({
      tableNumber: 4,
      capacity: 2,
      additionalCapacity: 0,
      status: TableCondition.AVAILABLE,
    });
    expect(TableQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 10,
      sortBy: 'id',
      sortOrder: 'asc',
    });
  });

  it('parses false correctly in update payloads', () => {
    expect(TableUpdateSchema.parse({ isOccupied: 'false' }).isOccupied).toBe(
      false
    );
  });

  it('rejects invalid table data', () => {
    expect(() =>
      TableCreateSchema.parse({ tableNumber: 0, capacity: 2 })
    ).toThrow();
    expect(() => TableQuerySchema.parse({ sortBy: 'unknown' })).toThrow();
  });
});
