import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { BaseService } from './base.service';

class TestBaseService extends BaseService {
	protected serviceName = 'TestService';
}

describe('BaseService', () => {
	it('should return a 409 HTTPError for a Prisma P2002 unique constraint violation', () => {
		const testService = new TestBaseService();
		const prismaError = new PrismaClientKnownRequestError('Unique constraint failed', {
			code: 'P2002',
			clientVersion: '2.0.0',
		});

		const result = testService['handleError'](prismaError);

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(409);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('Unique constraint violation');
		expect(result.path).toBe('Database operation failed: Unique constraint failed');
	});

	it('should return a 404 HTTPError for a Prisma P2025 record not found error', () => {
		const testService = new TestBaseService();
		const prismaError = new PrismaClientKnownRequestError('Record not found', {
			code: 'P2025',
			clientVersion: '2.0.0',
		});

		const result = testService['handleError'](prismaError);

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(404);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('Record not found');
		expect(result.path).toBe('Database operation failed: Record not found');
	});

	it('should return a 400 HTTPError for Prisma P2014, P2022, and P2023 invalid input data errors', () => {
		const testService = new TestBaseService();
		const prismaErrors = [
			new PrismaClientKnownRequestError('Invalid relation', {
				code: 'P2014',
				clientVersion: '2.0.0',
			}),
			new PrismaClientKnownRequestError('Column does not exist', {
				code: 'P2022',
				clientVersion: '2.0.0',
			}),
			new PrismaClientKnownRequestError('Inconsistent column data', {
				code: 'P2023',
				clientVersion: '2.0.0',
			}),
		];

		prismaErrors.forEach((error) => {
			const result = testService['handleError'](error);

			expect(result).toBeInstanceOf(HTTPError);
			expect(result.statusCode).toBe(400);
			expect(result.context).toBe('TestService');
			expect(result.message).toBe('Invalid input data');
			expect(result.path).toBe(`Database operation failed: ${error.message}`);
		});
	});

	it('should return a 500 HTTPError for unknown Prisma error codes', () => {
		const testService = new TestBaseService();
		const prismaError = new PrismaClientKnownRequestError('Unknown error', {
			code: 'P9999',
			clientVersion: '2.0.0',
		});

		const result = testService['handleError'](prismaError);

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(500);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('Database operation failed');
		expect(result.path).toBe('Unknown error');
	});

	it('should preserve the original HTTPError status code when handling an existing HTTPError', () => {
		const testService = new TestBaseService();
		const originalError = new HTTPError(
			403,
			'OriginalService',
			'Forbidden access',
			'Access denied'
		);

		const result = testService['handleError'](originalError);

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(403);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('Forbidden access');
		expect(result.path).toBe('Access denied');
	});

	it('should use the service name in the HTTPError when handling any type of error', () => {
		class TestService extends BaseService {
			protected serviceName = 'TestService';
		}

		const testService = new TestService();

		const prismaError = new PrismaClientKnownRequestError('Test error', {
			code: 'P2002',
			clientVersion: '2.0.0',
		});
		const httpError = new HTTPError(400, 'OtherService', 'Bad Request', 'Invalid input');
		const genericError = new Error('Generic error');

		const prismaResult = testService['handleError'](prismaError);
		const httpResult = testService['handleError'](httpError);
		const genericResult = testService['handleError'](genericError);

		expect(prismaResult.context).toBe('TestService');
		expect(httpResult.context).toBe('TestService');
		expect(genericResult.context).toBe('TestService');
	});

	it('should return a 500 HTTPError with a generic message for unexpected non-Error objects', () => {
		const testService = new TestBaseService();
		const unexpectedObject = { foo: 'bar' };

		const result = testService['handleError'](unexpectedObject);

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(500);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('An unexpected error occurred');
		expect(result.path).toBe('[object Object]');
	});

	it('should include the original error message in the HTTPError details', () => {
		const testService = new TestBaseService();
		const originalError = new Error('Original error message');

		const result = testService['handleError'](originalError);

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(500);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('An unexpected error occurred');
		expect(result.path).toBe('Original error message');
	});

	it('should handle Error instances by including their message in the HTTPError', () => {
		const testService = new TestBaseService();
		const errorMessage = 'Test error message';
		const error = new Error(errorMessage);

		const result = testService['handleError'](error);

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(500);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('An unexpected error occurred');
		expect(result.path).toBe(errorMessage);
	});

	it('should convert non-Error, non-HTTPError objects to strings in the error message', () => {
		const testService = new TestBaseService();
		const nonErrorObject = { key: 'value' };

		const result = testService['handleError'](nonErrorObject);

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(500);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('An unexpected error occurred');
		expect(result.path).toBe('[object Object]');
	});
});
