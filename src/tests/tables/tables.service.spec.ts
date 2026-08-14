import { TableCondition } from '@prisma/client';
import { HTTPError } from '../../errors/http-error.class';
import { TableDto, TableQueryDto } from '../../tables/dto';
import { ITablesRepository } from '../../tables/tables.repository.interface';
import { TablesService } from '../../tables/tables.service';

const table = (overrides: Partial<TableDto> = {}): TableDto => ({
  id: 1,
  tableNumber: 4,
  capacity: 2,
  status: TableCondition.AVAILABLE,
  additionalCapacity: 0,
  isOccupied: false,
  originalCapacity: 2,
  guests: 0,
  ...overrides,
});

const repositoryMock = (): jest.Mocked<ITablesRepository> =>
  ({
    findMany: jest.fn(),
    findById: jest.fn(),
    findByTableNumber: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    assignTables: jest.fn(),
  }) as jest.Mocked<ITablesRepository>;

describe('TablesService', () => {
  let repository: jest.Mocked<ITablesRepository>;
  let service: TablesService;

  beforeEach(() => {
    repository = repositoryMock();
    service = new TablesService(repository);
  });

  it('returns paginated tables', async () => {
    const criteria = {
      page: 2,
      pageSize: 2,
      sortBy: 'id',
      sortOrder: 'asc',
    } as TableQueryDto;
    repository.findMany.mockResolvedValue({ tables: [table()], total: 5 });

    await expect(service.findTables(criteria)).resolves.toEqual({
      tables: [table()],
      totalCount: 5,
      page: 2,
      pageSize: 2,
      totalPages: 3,
    });
  });

  it('rejects duplicate table numbers', async () => {
    repository.findByTableNumber.mockResolvedValue(table());

    await expect(
      service.createTable({
        tableNumber: 4,
        capacity: 2,
        additionalCapacity: 0,
        status: TableCondition.AVAILABLE,
      })
    ).rejects.toBeInstanceOf(HTTPError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('deletes an existing table', async () => {
    repository.findById.mockResolvedValue(table());

    await expect(service.deleteTable(1)).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(1);
  });

  it('delegates table assignment to the repository', async () => {
    const data = { serverId: 7, assignedTables: [1, 2], isPrimary: true };

    await expect(service.assignTables(data)).resolves.toBeUndefined();
    expect(repository.assignTables).toHaveBeenCalledWith(data);
  });
});
