import { TableCondition } from '../../../dto/enums';
import {
	TableCreateSchema,
	TableIdSchema,
	TableSchema,
	TableSearchCriteriaSchema,
	TableUpdatesSchema,
} from '../../../dto/tables.dto';

describe('Table DTO Schemas', () => {
	describe('TableSchema', () => {
		it('should validate a correct table object', () => {
			const table = {
				id: 1,
				tableNumber: 1,
				capacity: 4,
				guests: 2,
				originalCapacity: 4,
				additionalCapacity: 0,
				isOccupied: false,
				status: TableCondition.AVAILABLE,

				assignment: [
					{
						serverId: 1,
						isPrimary: true,
						assignedTables: [1],
					},
				],
			};
			expect(() => TableSchema.parse(table)).not.toThrow();
		});

		it('should invalidate an incorrect table object', () => {
			const table = {
				id: -1,
				tableNumber: -1,
				capacity: -4,
				guests: -2,
				originalCapacity: -4,
				additionalCapacity: -1,
				isOccupied: 'false',
				status: 'INVALID_STATUS',
				orders: {
					id: -1,
					status: 'INVALID_STATUS',
					orderTime: 'invalid-date',
				},
				assignment: {
					serverId: -1,
					isPrimary: 'true',
					assignedTables: [-1],
				},
			};
			expect(() => TableSchema.parse(table)).toThrow();
		});
	});

	describe('TableSearchCriteriaSchema', () => {
		it('should validate correct table search criteria', () => {
			const criteria = {
				id: '1',
				tableNumber: '1',
				minCapacity: '2',
				maxCapacity: '4',
				isOccupied: 'true',
				status: 'AVAILABLE',
				serverId: '1',
				page: '1',
				pageSize: '10',
				sortBy: 'id',
				sortOrder: 'asc',
			};
			expect(() => TableSearchCriteriaSchema.parse(criteria)).not.toThrow();
		});

		it('should invalidate incorrect table search criteria', () => {
			const criteria = {
				id: 'invalid-id',
				tableNumber: 'invalid-tableNumber',
				minCapacity: 'invalid-minCapacity',
				maxCapacity: 'invalid-maxCapacity',
				isOccupied: 'invalid-isOccupied',
				status: 'INVALID_STATUS',
				serverId: 'invalid-serverId',
				page: 'invalid-page',
				pageSize: 'invalid-pageSize',
				sortBy: 'invalid-sortBy',
				sortOrder: 'invalid-sortOrder',
			};
			expect(() => TableSearchCriteriaSchema.parse(criteria)).toThrow();
		});
	});

	describe('TableCreateSchema', () => {
		it('should validate a correct create table object', () => {
			const table = {
				tableNumber: 1,
				capacity: 4,
			};
			expect(() => TableCreateSchema.parse(table)).not.toThrow();
		});

		it('should invalidate an incorrect create table object', () => {
			const table = {
				tableNumber: -1,
				capacity: -4,
			};
			expect(() => TableCreateSchema.parse(table)).toThrow();
		});
	});

	describe('TableUpdatesSchema', () => {
		it('should validate correct table update properties', () => {
			const updateProps = {
				tableNumber: 1,
				capacity: 4,
			};
			expect(() => TableUpdatesSchema.parse(updateProps)).not.toThrow();
		});

		it('should invalidate incorrect table update properties', () => {
			const updateProps = {
				tableNumber: -1,
				capacity: -4,
			};
			expect(() => TableUpdatesSchema.parse(updateProps)).toThrow();
		});
	});

	describe('TableIdSchema', () => {
		it('should validate a correct table ID', () => {
			const id = { id: 1 };
			expect(() => TableIdSchema.parse(id)).not.toThrow();
		});

		it('should invalidate an incorrect table ID', () => {
			const id = { id: -1 };
			expect(() => TableIdSchema.parse(id)).toThrow();
		});
	});
});
