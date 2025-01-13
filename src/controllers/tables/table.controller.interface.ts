import { NextFunction, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { TypedRequest } from '../../common/route.interface';
import {
	TableAssignment,
	TableCreate,
	TableId,
	TableSearchCriteria,
	TableUpdate,
} from '../../dto/tables.dto';

export abstract class ITableController extends BaseController {
	/**
	 * Retrieves tables based on the provided search criteria.
	 * @param req - The request object containing search criteria in the query parameters.
	 * @param res - The response object to send the retrieved tables.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the tables are retrieved and sent in the response.
	 */
	abstract getTables(
		req: TypedRequest<{}, TableSearchCriteria, {}>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Creates a new table with the provided details.
	 * @param req - The request object containing the table creation details in the body.
	 * @param res - The response object to send the created table details.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the table is created and the response is sent.
	 */
	abstract createTable(
		req: TypedRequest<unknown, unknown, TableCreate>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Deletes a table based on the provided table ID.
	 * @param req - The request object containing the table ID in the parameters.
	 * @param res - The response object to send the deletion confirmation.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the table is deleted and the response is sent.
	 */
	abstract deleteTable(
		req: TypedRequest<TableId, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Clears a table, typically used when guests leave and the table becomes available.
	 * @param req - The request object containing the table ID in the parameters.
	 * @param res - The response object to send the clearing confirmation.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the table is cleared and the response is sent.
	 */
	abstract clearTable(
		req: TypedRequest<TableId, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Updates the details of an existing table.
	 * @param req - The request object containing the table ID in the parameters and update details in the body.
	 * @param res - The response object to send the updated table details.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the table is updated and the response is sent.
	 */
	abstract updateTable(
		req: TypedRequest<TableId, {}, TableUpdate>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Assigns a table to a specific server.
	 * @param req - The request object containing the table ID in the parameters and server assignment details in the body.
	 * @param res - The response object to send the assignment confirmation.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the table is assigned to a server and the response is sent.
	 */
	abstract assignTableToServer(
		req: TypedRequest<TableId, {}, TableAssignment>,
		res: Response,
		next: NextFunction
	): Promise<void>;
}
