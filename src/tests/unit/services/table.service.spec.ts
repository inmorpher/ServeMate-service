import { PrismaClient, Table, TableCondition } from '@prisma/client';
import { Container } from 'inversify';
import { TableCreate, TablesDTO, TableSearchCriteria } from '../../../dto/tables.dto';
import { HTTPError } from '../../../errors/http-error.class';
import { TableService } from '../../../services/tables/table.service';
import { TYPES } from '../../../types';

describe('TableService', () => {
	let container: Container;
	let tableService: TableService;
	let prismaClient: jest.Mocked<PrismaClient>;

	beforeEach(() => {
		container = new Container();

		prismaClient = {
			$transaction: jest.fn().mockImplementation((callback) => {
				return callback(prismaClient);
			}),
			table: {
				findMany: jest.fn(),
				count: jest.fn(),
				findUnique: jest.fn(),
				create: jest.fn(),
				delete: jest.fn(),
				update: jest.fn(),
				findFirst: jest.fn(),
				some: jest.fn(),
				deleteMany: jest.fn(),
			},
			orders: {
				some: jest.fn(),
			},
			tableAssignment: {
				deleteMany: jest.fn(),
			},
			user: {
				findUnique: jest.fn(),
			},
		} as unknown as jest.Mocked<PrismaClient>;
		container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prismaClient);
		container.bind<TableService>(TYPES.TableService).to(TableService);

		tableService = container.get<TableService>(TYPES.TableService);
	});

	describe('findTables', () => {
		it('should return tables with pagination', async () => {
			const criteria: TableSearchCriteria = {
				page: 1,
				pageSize: 10,
				sortBy: 'id',
				sortOrder: 'asc',
			};

			(prismaClient.table.findMany as jest.Mock).mockResolvedValue([]);
			(prismaClient.table.count as jest.Mock).mockResolvedValue(0);

			const result = await tableService.findTables(criteria);

			expect(prismaClient.table.findMany).toHaveBeenCalled();
			expect(prismaClient.table.count).toHaveBeenCalled();
			expect(result).toEqual({
				tables: [],
				totalCount: 0,
				page: 1,
				pageSize: 10,
				totalPages: 0,
			});
		});

		it('should handle errors', async () => {
			const criteria: TableSearchCriteria = {
				page: 1,
				pageSize: 10,
				sortBy: 'id',
				sortOrder: 'asc',
			};
			const errorMessage = 'An unexpected error occurred';
			(prismaClient.table.findMany as jest.Mock).mockRejectedValue(new Error(errorMessage));

			await expect(tableService.findTables(criteria)).rejects.toThrow(errorMessage);

			expect(prismaClient.table.findMany).toHaveBeenCalled();
		});
	});

	describe('findTableById', () => {
		it('should return a table when found', async () => {
			const table = { id: 1, tableNumber: 5, capacity: 4, status: 'AVAILABLE' };
			// prisma.table.findUnique.mockResolvedValue(table);
			(prismaClient.table.findUnique as jest.Mock).mockResolvedValue(table);

			const result = await tableService.findTableById(1);

			expect(prismaClient.table.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				include: {
					orders: {
						select: {
							id: true,
							orderTime: true,
							status: true,
						},
					},
					assignment: true,
				},
			});
			expect(result).toEqual({ ...table, status: table.status });
		});

		it('should throw HTTPError if table not found', async () => {
			// prisma.table.findUnique.mockResolvedValue(null);
			(prismaClient.table.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(tableService.findTableById(1)).rejects.toThrow(HTTPError);
		});
	});

	describe('createTable', () => {
		it('should create a new table', async () => {
			const tableCreate: TableCreate = { tableNumber: 10, capacity: 6 };
			const mockTable = {
				id: 1,
				tableNumber: 10,
				capacity: 6,
				originalCapacity: 6,
				status: 'AVAILABLE',
			} as Table;

			(prismaClient.table.create as jest.Mock).mockResolvedValue(mockTable);

			(prismaClient.table.findFirst as jest.Mock).mockResolvedValue(null);

			const result = await tableService.createTable(tableCreate);

			expect(result).toEqual({ tableNumber: 10 });
		});
	});

	//delete table
	describe('deleteTable', () => {
		it('should delete a table', async () => {
			const tableId = 1;
			(prismaClient.table.delete as jest.Mock).mockResolvedValue({ id: tableId });

			const result = await tableService.deleteTable(tableId);

			expect(prismaClient.table.delete).toHaveBeenCalledWith({ where: { id: tableId } });
			expect(result).toEqual(undefined);
		});

		it('should invalidate cache by keys when deleting a table', async () => {
			const tableId = 1;
			(prismaClient.table.delete as jest.Mock).mockResolvedValue({ id: tableId });

			await tableService.deleteTable(tableId);

			expect(prismaClient.table.delete).toHaveBeenCalledWith({ where: { id: tableId } });
		});

		it('should handle errors when deleting a table', async () => {
			const tableId = 1;
			const errorMessage = 'An unexpected error occurred';
			(prismaClient.table.delete as jest.Mock).mockRejectedValue(new Error(errorMessage));

			await expect(tableService.deleteTable(tableId)).rejects.toThrow(errorMessage);

			expect(prismaClient.table.delete).toHaveBeenCalledWith({ where: { id: tableId } });
		});
	});

	describe('updateTable', () => {
		it('should update a table', async () => {
			const tableId = 1;
			const tableUpdate: TableCreate = { tableNumber: 10, capacity: 6 };
			const mockTable = {
				id: 1,
				tableNumber: 10,
				capacity: 6,
				originalCapacity: 6,
				status: 'AVAILABLE',
			} as Table;
			(prismaClient.table.findUnique as jest.Mock).mockResolvedValue(mockTable);
			(prismaClient.table.update as jest.Mock).mockResolvedValue(mockTable);

			const result = await tableService.updateTable(tableId, tableUpdate);

			expect(prismaClient.table.update).toHaveBeenCalledWith({
				where: { id: tableId },
				data: { ...tableUpdate, originalCapacity: tableUpdate.capacity },
			});
			expect(result).toEqual({
				...tableUpdate,
				originalCapacity: tableUpdate.capacity,
				status: 'AVAILABLE',
				id: 1,
			});
		});

		it('should throw HTTPError if table update fails', async () => {
			const tableId = 1;
			const tableUpdate: TableCreate = { tableNumber: 10, capacity: 6 };
			const message = 'An unknown error occurred';
			(prismaClient.table.findUnique as jest.Mock).mockResolvedValue({ id: tableId });
			(prismaClient.table.update as jest.Mock).mockRejectedValue(new HTTPError(message));

			await expect(tableService.updateTable(tableId, tableUpdate)).rejects.toThrow(message);

			expect(prismaClient.table.findUnique).toHaveBeenCalledWith({ where: { id: tableId } });
			expect(prismaClient.table.update).toHaveBeenCalledWith({
				where: { id: tableId },
				data: { ...tableUpdate, originalCapacity: tableUpdate.capacity },
			});
		});
	});

	//clear table
	describe('clearTable', () => {
		it('should clear a table', async () => {
			const tableId = 1;
			const mockTable = {
				id: 1,
				tableNumber: 10,
				capacity: 6,
				originalCapacity: 6,
				additionalCapacity: 0,
				status: TableCondition.AVAILABLE,
			} as TablesDTO;

			(prismaClient.table.findUnique as jest.Mock).mockResolvedValue(mockTable);

			(prismaClient.table.update as jest.Mock).mockResolvedValue(mockTable);

			await expect(tableService.clearTable(tableId)).resolves.toBe(
				`Table ${mockTable.tableNumber} cleared successfully`
			);
		});

		//it should throw error if table is not exist
		it('should throw error if table is not exist', async () => {
			const tableId = 1;
			(prismaClient.table.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(tableService.clearTable(tableId)).rejects.toThrow(HTTPError);
		});

		it('should not clear table if table has unfinished order', async () => {
			const tableId = 1;
			const mockTable = {
				id: 1,
				tableNumber: 10,
				capacity: 6,
				originalCapacity: 6,
				additionalCapacity: 0,
				status: TableCondition.OCCUPIED,
				orders: [{ status: 'SERVED' }],
			} as TablesDTO;

			(prismaClient.table.findUnique as jest.Mock).mockResolvedValue(mockTable);

			await expect(tableService.clearTable(tableId)).rejects.toThrow(HTTPError);
		});

		it('should not clear table if table has unfinished payment', async () => {
			const tableId = 1;
			const mockTable = {
				id: 1,
				tableNumber: 10,
				capacity: 6,
				originalCapacity: 6,
				additionalCapacity: 0,
				status: TableCondition.PAYMENT,
				orders: [{ status: 'SERVED', paymentStatus: 'NONE' }],
			} as unknown as TablesDTO;

			(prismaClient.table.findUnique as jest.Mock).mockResolvedValue(mockTable);

			await expect(tableService.clearTable(tableId)).rejects.toThrow(HTTPError);
		});

		it('should delete non-primary assignments when clearing a table', async () => {
			const tableId = 1;
			const mockTable = {
				id: tableId,
				tableNumber: 10,
				capacity: 6,
				originalCapacity: 6,
				assignment: [{ isPrimary: false }, { isPrimary: false }],
				orders: [],
			} as unknown as TablesDTO;

			(prismaClient.table.findUnique as jest.Mock).mockResolvedValue(mockTable);
			(prismaClient.tableAssignment.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

			const result = await tableService.clearTable(tableId);

			expect(prismaClient.table.findUnique).toHaveBeenCalledWith({
				where: { id: tableId },
				include: {
					assignment: true,
					orders: {
						include: {
							payments: true,
						},
					},
				},
			});
			expect(prismaClient.tableAssignment.deleteMany).toHaveBeenCalledWith({
				where: { tableId: tableId, isPrimary: false },
			});
			expect(result).toBe(`Table ${mockTable.tableNumber} cleared successfully`);
		});

		it('should handle errors when clearing a table', async () => {
			const tableId = 1;
			(prismaClient.table.findUnique as jest.Mock).mockRejectedValue(new Error('Clear failed'));

			await expect(tableService.clearTable(tableId)).rejects.toThrow(
				'An unexpected error occurred'
			);

			expect(prismaClient.table.findUnique).toHaveBeenCalledWith({
				where: { id: tableId },
				include: {
					assignment: true,
					orders: {
						include: {
							payments: true,
						},
					},
				},
			});
		});
	});

	describe('assignTables', () => {
		it('should throw HTTPError if one or more tables are not found', async () => {
			const serverId = 1;
			const tableIds = [1, 2, 3];
			(prismaClient.user.findUnique as jest.Mock).mockResolvedValue({
				id: serverId,
				name: 'Server1',
			});
			(prismaClient.table.findMany as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]); // Missing table 3

			await expect(tableService.assignTables(tableIds, serverId)).rejects.toThrow(
				'One or more tables are not found.'
			);

			expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: serverId },
				select: { id: true, name: true },
			});
			expect(prismaClient.table.findMany).toHaveBeenCalledWith({
				where: { id: { in: tableIds } },
				include: { assignment: true },
			});
		});

		it('should handle errors when assigning tables', async () => {
			const serverId = 1;
			const tableIds = [1, 2];
			(prismaClient.user.findUnique as jest.Mock).mockRejectedValue(new Error('Assign failed'));

			await expect(tableService.assignTables(tableIds, serverId)).rejects.toThrow(
				'An unexpected error occurred'
			);

			expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: serverId },
				select: { id: true, name: true },
			});
		});
	});
});
