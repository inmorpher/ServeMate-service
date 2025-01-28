import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { TypedRequest } from '../../common/route.interface';
import {
	TableAssignment,
	TableAssignmentSchema,
	TableCreate,
	TableCreateSchema,
	TableId,
	TableIdSchema,
	TableSearchCriteria,
	TableSearchCriteriaSchema,
	TableUpdate,
	TableUpdatesSchema,
} from '../../dto/tables.dto';

import { Controller, Delete, Get, Patch, Post, Put } from '../../decorators/httpDecorators';
import { Validate } from '../../middleware/validate/validate.middleware';
import { ILogger } from '../../services/logger/logger.service.interface';
import { TableService } from '../../services/tables/table.service';
import { TYPES } from '../../types';
import { ITableController } from './table.controller.interface';

/**
 * Controller for managing table-related operations.
 */
@injectable()
@Controller('/tables')
export class TableController extends ITableController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.TableService) private tableService: TableService
	) {
		super(loggerService);
	}

	/**
	 * Retrieves a list of tables based on search criteria.
	 * @param req - The request object containing query parameters.
	 * @param res - The response object.
	 * @param next - The next middleware function.
	 */
	@Validate(TableSearchCriteriaSchema, 'query')
	@Get('/')
	async getTables(
		req: TypedRequest<{}, TableSearchCriteria, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const queryParams: TableSearchCriteria = req.query;
			const result = await this.tableService.findTables(queryParams);
			this.ok(res, result);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Retrieves a table by its ID.
	 * @param req - The request object containing the table ID.
	 * @param res - The response object.
	 * @param next - The next middleware function.
	 */
	@Validate(TableIdSchema.pick({ id: true }), 'params')
	@Get('/:id')
	async getTableById(
		req: TypedRequest<TableId, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const tableId = req.params.id;
			const table = await this.tableService.findTableById(tableId);
			this.ok(res, table);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Creates a new table.
	 * @param req - The request object containing table creation data.
	 * @param res - The response object.
	 * @param next - The next middleware function.
	 */
	@Validate(TableCreateSchema, 'body')
	@Post('/')
	async createTable(
		req: TypedRequest<unknown, unknown, TableCreate>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const newTable = await this.tableService.createTable(req.body);
			const message = `Table ${newTable.tableNumber} created successfully`;
			this.loggerService.log(message);
			this.ok(res, message);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Deletes a table by its ID.
	 * @param req - The request object containing the table ID.
	 * @param res - The response object.
	 * @param next - The next middleware function.
	 */
	@Validate(TableIdSchema, 'params')
	@Delete('/:id')
	async deleteTable(
		req: TypedRequest<TableId, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const tableId = req.params.id;
			await this.tableService.deleteTable(tableId);

			const message = `Table ${tableId} deleted successfully`;
			this.loggerService.log(message);
			this.ok(res, message);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Updates a table with the provided data.
	 * @param req - The request object containing the table ID and update data.
	 * @param res - The response object.
	 * @param next - The next middleware function.
	 */
	@Validate(TableUpdatesSchema, 'body')
	@Validate(TableIdSchema, 'params')
	@Put('/:id')
	async updateTable(
		req: TypedRequest<TableId, {}, TableUpdate>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const tableId = req.params.id;
			const updateData = req.body;

			await this.tableService.updateTable(tableId, updateData);

			this.ok(res, `Table ${tableId} updated successfully`);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Clears a table by its ID.
	 * @param req - The request object containing the table ID.
	 * @param res - The response object.
	 * @param next - The next middleware function.
	 */
	@Validate(TableIdSchema, 'params')
	@Patch('/:id/clear')
	async clearTable(
		req: TypedRequest<TableId, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const tableId = req.params.id;
			await this.tableService.clearTable(tableId);

			const message = `Table ${tableId} cleared successfully`;
			this.loggerService.log(message);
			this.ok(res, message);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Assigns tables to a server.
	 * @param req - The request object containing server ID and tables to assign.
	 * @param res - The response object.
	 * @param next - The next middleware function.
	 */
	@Validate(TableAssignmentSchema, 'body')
	@Post('/assign')
	async assignTableToServer(
		req: TypedRequest<{}, {}, TableAssignment>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const { serverId, assignedTables } = req.body;
			await this.tableService.assignTables(assignedTables, serverId);
			const message = `Tables ${assignedTables.join(
				', '
			)} assigned to server ${serverId} successfully`;
			this.loggerService.log(message);
			this.ok(res, message);
		} catch (error) {
			next(error);
		}
	}
}
