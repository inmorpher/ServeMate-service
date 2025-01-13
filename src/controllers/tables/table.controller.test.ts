import { NextFunction, Request, Response } from 'express';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TypedRequest } from '../../common/route.interface';
import {
	TableAssignment,
	TableCreate,
	TableSearchCriteria,
	TableSearchCriteriaSchema,
	TableUpdate,
} from '../../dto/tables.dto';
import { ILogger } from '../../services/logger/logger.service.interface';
import { TableService } from '../../services/tables/table.service';
import { TYPES } from '../../types';
import { TableController } from './table.controller';

describe('TableController', () => {
	let tableController: TableController;
	let tableService: jest.Mocked<TableService>;
	let logger: jest.Mocked<ILogger>;
	let req: Partial<TypedRequest<{}, {}, {}>>;
	let res: Partial<Response>;
	let next: NextFunction;
	let okSpy: jest.SpyInstance;

	beforeEach(() => {
		tableService = {
			findTables: jest.fn(),
			findTableById: jest.fn(),
			createTable: jest.fn(),
			deleteTable: jest.fn(),
			updateTable: jest.fn(),
			clearTable: jest.fn(),
			assignTables: jest.fn(),
		} as any;

		logger = {
			log: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
		} as any;

		const container = new Container();
		container.bind<ILogger>(TYPES.ILogger).toConstantValue(logger);
		container.bind<TableService>(TYPES.TableService).toConstantValue(tableService);

		tableController = new TableController(logger, tableService);

		res = {
			status: jest.fn().mockReturnThis(),
			// json: jest.fn(), // Удалено
		};

		// Шпионаж на метод ok контроллера
		const mockResponse = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(),
		} as unknown as Response;

		okSpy = jest.spyOn(tableController, 'ok').mockImplementation(() => mockResponse);

		next = jest.fn();
	});

	describe('getTables', () => {
		it('should return a list of tables', async () => {
			const criteria = {
				page: 1,
				pageSize: 10,
			};
			const validatedCriteria = TableSearchCriteriaSchema.parse(criteria);

			req = { query: validatedCriteria } as TypedRequest<{}, TableSearchCriteria, {}>;
			const result = { tables: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 };
			tableService.findTables.mockResolvedValue(result);

			await tableController.getTables(
				req as TypedRequest<{}, TableSearchCriteria, {}>,
				res as Response,
				next as NextFunction
			);

			expect(tableService.findTables).toHaveBeenCalledWith(validatedCriteria);
			expect(okSpy).toHaveBeenCalledWith(res, result);
		});

		it('should handle errors', async () => {
			const criteria = {
				page: '1',
				pageSize: '10',
			};
			req = { query: criteria };
			const error = new Error('Test error');
			tableService.findTables.mockRejectedValue(error);

			await tableController.getTables(
				req as TypedRequest<{}, TableSearchCriteria, {}>,
				res as Response,
				next
			);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getTableById', () => {
		it('should return a table by ID', async () => {
			req = { params: { id: 1 } } as TypedRequest<{ id: number }, {}, {}>;
			const table = { id: 1, tableNumber: 1, capacity: 4 };
			tableService.findTableById.mockResolvedValue(table as any);

			await tableController.getTableById(
				req as TypedRequest<{ id: number }, {}, {}>,
				res as Response,
				next
			);

			expect(tableService.findTableById).toHaveBeenCalledWith(1);
			expect(okSpy).toHaveBeenCalledWith(res, table);
			// expect(res.json).toHaveBeenCalledWith(table); // Удалено
		});

		it('should handle table not found', async () => {
			req = { params: { id: '1' } };
			const error = new Error('Table not found');
			tableService.findTableById.mockRejectedValue(error);

			await tableController.getTableById(
				req as TypedRequest<{ id: number }, {}, {}>,
				res as Response,
				next
			);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('createTable', () => {
		it('should create a new table', async () => {
			const tableData: TableCreate = { tableNumber: 2, capacity: 4 };
			req = { body: tableData };
			tableService.createTable.mockResolvedValue({ tableNumber: 2 });

			await tableController.createTable(req as Request, res as Response, next);

			expect(tableService.createTable).toHaveBeenCalledWith(tableData);
			expect(logger.log).toHaveBeenCalledWith('Table 2 created successfully');
			expect(okSpy).toHaveBeenCalledWith(res, 'Table 2 created successfully');
		});

		it('should handle creation error', async () => {
			const tableData: TableCreate = { tableNumber: 2, capacity: 4 };
			req = { body: tableData };
			const error = new Error('Creation error');
			tableService.createTable.mockRejectedValue(error);

			await tableController.createTable(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('deleteTable', () => {
		it('should delete a table by ID', async () => {
			req = { params: { id: '1' } };
			tableService.deleteTable.mockResolvedValue();

			await tableController.deleteTable(
				req as TypedRequest<{ id: number }, {}, {}>,
				res as Response,
				next
			);

			expect(tableService.deleteTable).toHaveBeenCalledWith('1');
			expect(logger.log).toHaveBeenCalledWith('Table 1 deleted successfully');
			expect(okSpy).toHaveBeenCalledWith(res, 'Table 1 deleted successfully');
			// expect(res.json).toHaveBeenCalledWith('Table 1 deleted successfully'); // Удалено
		});

		it('should handle deletion error', async () => {
			req = { params: { id: '1' } };
			const error = new Error('Deletion error');
			tableService.deleteTable.mockRejectedValue(error);

			await tableController.deleteTable(
				req as TypedRequest<{ id: number }, {}, {}>,
				res as Response,
				next
			);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('updateTable', () => {
		it('should update a table', async () => {
			const tableUpdate: TableUpdate = { capacity: 6 };
			req = { params: { id: '1' }, body: tableUpdate };
			tableService.updateTable.mockResolvedValue({ id: 1, capacity: 6 });

			await tableController.updateTable(
				req as TypedRequest<{ id: number }, {}, {}>,
				res as Response,
				next
			);

			expect(tableService.updateTable).toHaveBeenCalledWith('1', tableUpdate);
			expect(okSpy).toHaveBeenCalledWith(res, 'Table 1 updated successfully');
			// expect(res.json).toHaveBeenCalledWith('Table 1 updated successfully'); // Удалено
		});

		it('should handle update error', async () => {
			const tableUpdate: TableUpdate = { capacity: 6 };
			req = { params: { id: '1' }, body: tableUpdate };
			const error = new Error('Update error');
			tableService.updateTable.mockRejectedValue(error);

			await tableController.updateTable(
				req as TypedRequest<{ id: number }, {}, {}>,
				res as Response,
				next
			);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('clearTable', () => {
		it('should clear a table', async () => {
			req = { params: { id: '1' } };
			tableService.clearTable.mockResolvedValue('Table 1 cleared successfully');

			await tableController.clearTable(
				req as TypedRequest<{ id: number }, {}, {}>,
				res as Response,
				next
			);

			expect(tableService.clearTable).toHaveBeenCalledWith('1');
			expect(logger.log).toHaveBeenCalledWith('Table 1 cleared successfully');
			expect(okSpy).toHaveBeenCalledWith(res, 'Table 1 cleared successfully');
			// expect(res.json).toHaveBeenCalledWith('Table 1 cleared successfully'); // Удалено
		});

		it('should handle clear error', async () => {
			req = { params: { id: '1' } };
			const error = new Error('Clear error');
			tableService.clearTable.mockRejectedValue(error);

			await tableController.clearTable(
				req as TypedRequest<{ id: number }, {}, {}>,
				res as Response,
				next
			);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('assignTableToServer', () => {
		it('should assign tables to a server', async () => {
			const assignment: TableAssignment = {
				serverId: 1,
				assignedTables: [1, 2, 3],
				isPrimary: true,
			};
			req = { body: assignment };
			tableService.assignTables.mockResolvedValue();

			await tableController.assignTableToServer(req as Request, res as Response, next);

			expect(tableService.assignTables).toHaveBeenCalledWith([1, 2, 3], 1);
			expect(logger.log).toHaveBeenCalledWith('Tables 1, 2, 3 assigned to server 1 successfully');
			expect(okSpy).toHaveBeenCalledWith(res, 'Tables 1, 2, 3 assigned to server 1 successfully');
			// expect(res.json).toHaveBeenCalledWith('Tables 1, 2, 3 assigned to server 1 successfully'); // Удалено
		});

		it('should handle assignment error', async () => {
			const assignment: TableAssignment = {
				serverId: 1,
				assignedTables: [1, 2, 3],
				isPrimary: true,
			};
			req = { body: assignment };
			const error = new Error('Assignment error');
			tableService.assignTables.mockRejectedValue(error);

			await tableController.assignTableToServer(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
