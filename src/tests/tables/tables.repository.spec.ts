import { TableCondition } from '@prisma/client';
import { TablesRepository } from '../../tables/tables.repository';

const selectedTable = {
  id: 1,
  tableNumber: 4,
  capacity: 2,
  status: TableCondition.AVAILABLE,
  additionalCapacity: 0,
  isOccupied: false,
  originalCapacity: 2,
  guests: 0,
};

const prismaMock = () => ({
  table: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  tableAssignment: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
});

describe('TablesRepository', () => {
  it('builds filters, pagination and sorting for findMany', async () => {
    const prisma = prismaMock();
    prisma.table.findMany.mockResolvedValue([selectedTable]);
    prisma.table.count.mockResolvedValue(1);
    const repository = new TablesRepository(prisma as any);

    await expect(
      repository.findMany(
        {
          id: undefined,
          tableNumber: 4,
          minCapacity: 2,
          maxCapacity: 6,
          status: TableCondition.AVAILABLE,
          isOccupied: false,
          page: 2,
          pageSize: 10,
          sortBy: 'capacity',
          sortOrder: 'desc',
        },
        { page: 2, pageSize: 10 },
        { sortBy: 'capacity', sortOrder: 'desc' }
      )
    ).resolves.toEqual({ tables: [selectedTable], total: 1 });

    expect(prisma.table.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tableNumber: 4,
          capacity: { gte: 2, lte: 6 },
          status: TableCondition.AVAILABLE,
          isOccupied: false,
        },
        skip: 10,
        take: 10,
        orderBy: { capacity: 'desc' },
      })
    );
  });

  it('maps create, update and delete operations to Prisma', async () => {
    const prisma = prismaMock();
    prisma.table.create.mockResolvedValue(selectedTable);
    prisma.table.update.mockResolvedValue(selectedTable);
    const repository = new TablesRepository(prisma as any);

    await repository.create({
      tableNumber: 4,
      capacity: 2,
      additionalCapacity: 1,
      status: TableCondition.AVAILABLE,
    });
    await repository.update(1, { capacity: 4, isOccupied: true });
    await repository.delete(1);

    expect(prisma.table.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          tableNumber: 4,
          capacity: 2,
          originalCapacity: 2,
          additionalCapacity: 1,
          status: TableCondition.AVAILABLE,
        },
      })
    );
    expect(prisma.table.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { capacity: 4, originalCapacity: 4, isOccupied: true },
      })
    );
    expect(prisma.table.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('finds tables by id and table number', async () => {
    const prisma = prismaMock();
    prisma.table.findUnique
      .mockResolvedValueOnce(selectedTable)
      .mockResolvedValueOnce(null);
    const repository = new TablesRepository(prisma as any);

    await expect(repository.findById(1)).resolves.toEqual(selectedTable);
    await expect(repository.findByTableNumber(99)).resolves.toBeNull();
  });

  it('replaces server assignments inside a transaction', async () => {
    const prisma = prismaMock();
    prisma.user.findUnique.mockResolvedValue({ id: 7 });
    prisma.table.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
    const repository = new TablesRepository(prisma as any);

    await repository.assignTables({
      serverId: 7,
      assignedTables: [1, 2],
      isPrimary: true,
    });

    expect(prisma.tableAssignment.deleteMany).toHaveBeenCalledWith({
      where: { serverId: 7 },
    });
    expect(prisma.tableAssignment.createMany).toHaveBeenCalledWith({
      data: [
        { tableId: 1, serverId: 7, isPrimary: true },
        { tableId: 2, serverId: 7, isPrimary: true },
      ],
    });
  });
});
