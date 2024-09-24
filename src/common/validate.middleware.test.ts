import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ValidateMiddleware } from './validate.middleware';

describe('ValidateMiddleware', () => {
	let validateMiddleware: ValidateMiddleware;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;

	beforeEach(() => {
		const schema = z.object({
			testParam: z.string(),
		});
		validateMiddleware = new ValidateMiddleware(schema);
		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};
		nextFunction = jest.fn();
	});

	it('should validate a query with valid parameters according to the schema', () => {
		const schema = z.object({
			testParam: z.string(),
		});
		validateMiddleware = new ValidateMiddleware(schema);
		mockRequest = {
			query: { testParam: 'validValue' },
		};

		validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalled();
		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.send).not.toHaveBeenCalled();
	});

	it('should return a 422 status code when query parameters fail validation', () => {
		const schema = z.object({
			testParam: z.number(),
		});
		validateMiddleware = new ValidateMiddleware(schema);
		mockRequest = {
			query: { testParam: 'invalidValue' },
		};

		validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.status).toHaveBeenCalledWith(422);
		expect(mockResponse.send).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					code: 'invalid_type',
					expected: 'number',
					received: 'string',
				}),
			])
		);
		expect(nextFunction).not.toHaveBeenCalled();
	});

	it('should pass control to the next middleware when validation succeeds', () => {
		const schema = z.object({
			testParam: z.string(),
		});
		validateMiddleware = new ValidateMiddleware(schema);
		mockRequest = {
			query: { testParam: 'validValue' },
		};

		validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalled();
		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.send).not.toHaveBeenCalled();
	});

	it('should validate complex nested query structures if defined in the schema', () => {
		const complexSchema = z.object({
			user: z
				.string()
				.transform((str) => JSON.parse(str))
				.pipe(
					z.object({
						name: z.string(),
						age: z.number(),
					})
				),
			preferences: z
				.string()
				.transform((str) => JSON.parse(str))
				.pipe(
					z.object({
						theme: z.enum(['light', 'dark']),
						notifications: z.boolean(),
					})
				),
			tags: z.array(z.string()),
		});
		validateMiddleware = new ValidateMiddleware(complexSchema);
		mockRequest = {
			query: {
				user: JSON.stringify({ name: 'John Doe', age: 30 }),
				preferences: JSON.stringify({ theme: 'light', notifications: true }),
				tags: ['tag1', 'tag2', 'tag3'],
			},
		};

		validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalled();
		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.send).not.toHaveBeenCalled();
	});

	it('should correctly parse and validate query parameters of different types (string, number, boolean)', () => {
		const schema = z.object({
			name: z.string(),
			age: z.string().transform((str) => parseInt(str)),
			isStudent: z.enum(['true', 'false']).transform((val) => val === 'true'),
		});
		validateMiddleware = new ValidateMiddleware(schema);
		mockRequest = {
			query: {
				name: 'John Doe',
				age: '25',
				isStudent: 'true',
			},
		};

		validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalled();
		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.send).not.toHaveBeenCalled();
	});

	it('should handle query parameters with special characters or spaces', () => {
		const schema = z.object({
			'special param': z.string(),
			'with@symbol': z.string(),
			'encoded space': z.string(),
		});
		validateMiddleware = new ValidateMiddleware(schema);
		mockRequest = {
			query: {
				'special param': 'value with spaces',
				'with@symbol': 'value@with@symbol',
				'encoded space': 'value%20with%20encoded%20space',
			},
		};

		validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalled();
		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.send).not.toHaveBeenCalled();
	});

	it('should validate array query parameters if defined in the schema', () => {
		const arraySchema = z.object({
			tags: z.array(z.string()),
			numbers: z.array(z.string().transform(Number)),
		});
		validateMiddleware = new ValidateMiddleware(arraySchema);
		mockRequest = {
			query: {
				tags: ['tag1', 'tag2', 'tag3'],
				numbers: ['1', '2', '3'],
			},
		};

		validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalled();
		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.send).not.toHaveBeenCalled();
	});

	it('should return detailed error messages for each invalid query parameter', () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
			email: z.string().email(),
		});
		validateMiddleware = new ValidateMiddleware(schema);
		mockRequest = {
			query: {
				name: 123 as unknown as string,
				age: 'twenty',
				email: 'invalid-email',
			},
		};

		validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.status).toHaveBeenCalledWith(422);
		expect(mockResponse.send).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					code: 'invalid_type',
					expected: 'string',
					received: 'number',
					path: ['name'],
				}),
				expect.objectContaining({
					code: 'invalid_type',
					expected: 'number',
					received: 'string',
					path: ['age'],
				}),
				expect.objectContaining({
					code: 'invalid_string',
					validation: 'email',
					path: ['email'],
				}),
			])
		);
		expect(nextFunction).not.toHaveBeenCalled();
	});

	it('should handle schema with optional query parameters correctly', () => {
		const schema = z.object({
			requiredParam: z.string(),
			optionalParam: z.string().optional(),
		});
		validateMiddleware = new ValidateMiddleware(schema);
		mockRequest = {
			query: { requiredParam: 'value' },
		};

		validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalled();
		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.send).not.toHaveBeenCalled();

		mockRequest = {
			query: { requiredParam: 'value', optionalParam: 'optionalValue' },
		};

		validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalled();
		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.send).not.toHaveBeenCalled();
	});
});
