import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import NodeCache from 'node-cache';
import 'reflect-metadata';
import { BaseService } from '../../../common/base.service';
import { HTTPError } from '../../../errors/http-error.class';

class TestBaseService extends BaseService {
	protected serviceName = 'TestService';
}

describe('BaseService', () => {
	let testService: TestBaseService;

	beforeEach(() => {
		testService = new TestBaseService();
	});

	describe('Cache Management', () => {
		it('should initialize with default cache settings', () => {
			expect(testService['_cache']).toBeInstanceOf(NodeCache);
			expect(testService['_cache'].options.stdTTL).toBe(60);
			expect(testService['_cache'].options.checkperiod).toBe(120);
		});

		it('should clear cache when clearCache is called', () => {
			const spy = jest.spyOn(testService['_cache'], 'flushAll');
			testService.clearCache();
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('Error Handling', () => {
		it('should handle Prisma unique constraint violation (P2002)', () => {
			const error = new PrismaClientKnownRequestError('Unique constraint failed', {
				code: 'P2002',
				clientVersion: '2.0.0',
			});

			const result = testService['handleError'](error);

			expect(result).toBeInstanceOf(HTTPError);
			expect(result.statusCode).toBe(409);
			expect(result.message).toBe('Unique constraint violation');
			expect(result.path).toBe('Database operation failed: Unique constraint failed');
		});

		it('should handle Prisma record not found error (P2025)', () => {
			const error = new PrismaClientKnownRequestError('Record not found', {
				code: 'P2025',
				clientVersion: '2.0.0',
			});

			const result = testService['handleError'](error);

			expect(result).toBeInstanceOf(HTTPError);
			expect(result.statusCode).toBe(404);
			expect(result.message).toBe('Record not found');
			expect(result.path).toBe('Database operation failed: Record not found');
		});

		it('should handle Prisma invalid input errors (P2014, P2022, P2023)', () => {
			const errorCodes = ['P2014', 'P2022', 'P2023'];
			errorCodes.forEach((code) => {
				const error = new PrismaClientKnownRequestError('Invalid input', {
					code,
					clientVersion: '2.0.0',
				});

				const result = testService['handleError'](error);

				expect(result).toBeInstanceOf(HTTPError);
				expect(result.statusCode).toBe(400);
				expect(result.message).toBe('Invalid input data');
				expect(result.path).toBe('Database operation failed: Invalid input');
			});
		});

		it('should handle unknown Prisma errors', () => {
			const error = new PrismaClientKnownRequestError('Unknown error', {
				code: 'P9999',
				clientVersion: '2.0.0',
			});

			const result = testService['handleError'](error);

			expect(result).toBeInstanceOf(HTTPError);
			expect(result.statusCode).toBe(500);
			expect(result.message).toBe('Database operation failed');
			expect(result.path).toBe('Unknown error');
		});

		it('should handle existing HTTPError', () => {
			const originalError = new HTTPError(403, 'OriginalService', 'Access denied', 'Forbidden');
			const result = testService['handleError'](originalError);

			expect(result).toBeInstanceOf(HTTPError);
			expect(result.statusCode).toBe(403);
			expect(result.message).toBe('Access denied');
			expect(result.path).toBe('Forbidden');
		});

		it('should handle generic Error', () => {
			const error = new Error('Generic error');
			const result = testService['handleError'](error);

			expect(result).toBeInstanceOf(HTTPError);
			expect(result.statusCode).toBe(500);
			expect(result.message).toBe('An unexpected error occurred');
			expect(result.path).toBe('Generic error');
		});
	});

	describe('Where Clause Building', () => {
		it('should build where clause excluding specified fields', () => {
			const criteria = {
				id: 1,
				name: 'test',
				page: 1,
				pageSize: 10,
				sortBy: 'id',
				sortOrder: 'asc',
				test: true,
				serverName: 'server1',
			};

			const result = testService['buildWhere'](criteria);

			expect(result).toEqual({
				id: 1,
				name: 'test',
			});
			expect(result).not.toHaveProperty('page');
			expect(result).not.toHaveProperty('pageSize');
			expect(result).not.toHaveProperty('sortBy');
			expect(result).not.toHaveProperty('sortOrder');
			expect(result).not.toHaveProperty('test');
			expect(result).not.toHaveProperty('serverName');
		});

		it('should handle array values in where clause', () => {
			const criteria = {
				ids: [1, 2, 3],
				names: ['test1', 'test2', ''],
			};

			const result = testService['buildWhere'](criteria);

			expect(result).toEqual({
				ids: { hasSome: [1, 2, 3] },
				names: { hasSome: ['test1', 'test2'] },
			});
		});

		it('should convert numeric strings to numbers', () => {
			const criteria = {
				id: '123',
				price: '45.67',
			};

			const result = testService['buildWhere'](criteria);

			expect(result).toEqual({
				id: 123,
				price: 45.67,
			});
		});

		it('should handle uppercase string values', () => {
			const criteria = {
				status: 'ACTIVE',
				name: 'John',
			};

			const result = testService['buildWhere'](criteria);

			expect(result).toEqual({
				status: { equals: 'ACTIVE' },
				name: 'John',
			});
		});
	});

	describe('Array Field Where Clause', () => {
		it('should build where clause for array fields', () => {
			const whereInput = {};
			testService['buildWhereForArrayField']('tags', ['tag1', 'tag2'], whereInput);

			expect(whereInput).toEqual({
				tags: { hasEvery: ['tag1', 'tag2'] },
			});
		});

		it('should apply transform function to array values', () => {
			const whereInput = {};
			const transform = (value: string) => value.toUpperCase();

			testService['buildWhereForArrayField']('tags', ['tag1', 'tag2'], whereInput, transform);

			expect(whereInput).toEqual({
				tags: { hasEvery: ['TAG1', 'TAG2'] },
			});
		});

		it('should not modify input when value is not an array', () => {
			const whereInput = {};
			testService['buildWhereForArrayField']('field', 'not-an-array', whereInput);

			expect(whereInput).toEqual({});
		});
	});
});
