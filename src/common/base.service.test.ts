import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { BaseService } from './base.service';

class TestBaseService extends BaseService {
	public testHandleError(error: unknown, serviceName: string): HTTPError {
		return this.handleError(error, serviceName);
	}
}

describe('BaseService', () => {
	it('should handle PrismaClientKnownRequestError with code P2002 and return a 409 HTTPError', () => {
		const testBaseService = new TestBaseService();
		const prismaError = new PrismaClientKnownRequestError('Unique constraint failed', {
			code: 'P2002',
			clientVersion: '2.0.0',
		});
		const result = testBaseService.testHandleError(prismaError, 'TestService');

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(409);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('Unique constraint violation');
		expect(result.path).toBe('Database operation failed: Unique constraint failed');
	});

	it('should handle PrismaClientKnownRequestError with code P2025 and return a 404 HTTPError', () => {
		const testBaseService = new TestBaseService();
		const prismaError = new PrismaClientKnownRequestError('Record to update not found', {
			code: 'P2025',
			clientVersion: '2.0.0',
		});
		const result = testBaseService.testHandleError(prismaError, 'TestService');

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(404);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('Record not found');
		expect(result.path).toBe('Database operation failed: Record to update not found');
	});

	it('should handle PrismaClientKnownRequestError with code P2014 and return a 400 HTTPError', () => {
		const testBaseService = new TestBaseService();
		const prismaError = new PrismaClientKnownRequestError('Invalid input data', {
			code: 'P2014',
			clientVersion: '2.0.0',
		});
		const result = testBaseService.testHandleError(prismaError, 'TestService');

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(400);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('Invalid input data');
		expect(result.path).toBe('Database operation failed: Invalid input data');
	});

	it('should handle PrismaClientKnownRequestError with an unknown code and return a 500 HTTPError', () => {
		const testBaseService = new TestBaseService();
		const prismaError = new PrismaClientKnownRequestError('Unknown error', {
			code: 'P9999', // An unknown code
			clientVersion: '2.0.0',
		});
		const result = testBaseService.testHandleError(prismaError, 'TestService');

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(500);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('Database operation failed');
		expect(result.path).toBe('Unknown error');
	});

	it('should handle an existing HTTPError and return a new HTTPError with the same status code', () => {
		const testBaseService = new TestBaseService();
		const existingError = new HTTPError(
			403,
			'OriginalService',
			'Forbidden access',
			'/api/resource'
		);
		const result = testBaseService.testHandleError(existingError, 'TestService');

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(403);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('Forbidden access');
		expect(result.path).toBe('/api/resource');
	});

	it('should handle an unexpected Error and return a 500 HTTPError with the error message', () => {
		const testBaseService = new TestBaseService();
		const unexpectedError = new Error('Unexpected error occurred');
		const result = testBaseService.testHandleError(unexpectedError, 'TestService');

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(500);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('An unexpected error occurred');
		expect(result.path).toBe('Unexpected error occurred');
	});

	it('should handle a non-Error object and return a 500 HTTPError with the stringified object', () => {
		const testBaseService = new TestBaseService();
		const nonErrorObject = { customField: 'customValue' };
		const result = testBaseService.testHandleError(nonErrorObject, 'TestService');

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(500);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('An unexpected error occurred');
	});

	it('should correctly set the serviceName in the returned HTTPError', () => {
		const testBaseService = new TestBaseService();
		const serviceName = 'CustomService';
		const error = new Error('Test error');
		const result = testBaseService.testHandleError(error, serviceName);

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.context).toBe(serviceName);
		expect(result.statusCode).toBe(500);
		expect(result.message).toBe('An unexpected error occurred');
		expect(result.path).toBe('Test error');
	});

	it('should preserve the original error message in the detail field of the returned HTTPError', () => {
		const testBaseService = new TestBaseService();
		const originalMessage = 'Original error message';
		const error = new Error(originalMessage);
		const result = testBaseService.testHandleError(error, 'TestService');

		expect(result).toBeInstanceOf(HTTPError);
		expect(result.statusCode).toBe(500);
		expect(result.context).toBe('TestService');
		expect(result.message).toBe('An unexpected error occurred');
		expect(result.path).toBe(originalMessage);
	});

	it('should handle multiple PrismaClientKnownRequestError codes (P2022, P2023) and return a 400 HTTPError', () => {
		const testBaseService = new TestBaseService();
		const prismaErrorP2022 = new PrismaClientKnownRequestError('Invalid column name', {
			code: 'P2022',
			clientVersion: '2.0.0',
		});
		const prismaErrorP2023 = new PrismaClientKnownRequestError('Inconsistent column data', {
			code: 'P2023',
			clientVersion: '2.0.0',
		});

		const resultP2022 = testBaseService.testHandleError(prismaErrorP2022, 'TestService');
		const resultP2023 = testBaseService.testHandleError(prismaErrorP2023, 'TestService');

		[resultP2022, resultP2023].forEach((result) => {
			expect(result).toBeInstanceOf(HTTPError);
			expect(result.statusCode).toBe(400);
			expect(result.context).toBe('TestService');
			expect(result.message).toBe('Invalid input data');
			expect(result.path).toMatch(/^Database operation failed:/);
		});

		expect(resultP2022.path).toBe('Database operation failed: Invalid column name');
		expect(resultP2023.path).toBe('Database operation failed: Inconsistent column data');
	});
});
