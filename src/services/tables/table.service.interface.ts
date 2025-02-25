import { TableCreate, TableSearchCriteria, TablesList, TableUpdate } from '@servemate/dto';
import { BaseService } from '../../common/base.service';

/**
 * Abstract class representing the table service.
 * Extends the BaseService class.
 */
export abstract class ITableService extends BaseService {
	/**
	 * Finds tables based on the given search criteria.
	 * @param criteria - The criteria to search for tables.
	 * @returns A promise that resolves to a list of tables.
	 */
	abstract findTables(criteria: TableSearchCriteria): Promise<TablesList>;

	/**
	 * Creates a new table.
	 * @param table - The details of the table to create.
	 * @returns A promise that resolves to an object containing the table number.
	 */
	abstract createTable(table: TableCreate): Promise<{ tableNumber: number }>;

	/**
	 * Updates an existing table.
	 * @param id - The ID of the table to update.
	 * @param table - The updated table details.
	 * @returns A promise that resolves when the table is updated.
	 */
	abstract updateTable(id: number, table: TableUpdate): Promise<void>;

	/**
	 * Deletes a table.
	 * @param id - The ID of the table to delete.
	 * @returns A promise that resolves when the table is deleted.
	 */
	abstract deleteTable(id: number): Promise<void>;

	/**
	 * Clears a table.
	 * @param id - The ID of the table to clear.
	 * @returns A promise that resolves when the table is cleared.
	 */
	abstract clearTable(id: number): Promise<string>;
}
