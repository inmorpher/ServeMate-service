import { NextFunction, Request, Response } from 'express';
import 'reflect-metadata';
import { z } from 'zod';
import { ValidateMiddleware, ValidationType } from './validate.middleware';

describe('ValidateMiddleware', () => {
	let validateMiddleware: ValidateMiddleware;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		const schema = z.object({
			test: z.string(),
		});
		validateMiddleware = new ValidateMiddleware(schema, 'body');

		mockRequest = {
			body: {},
		};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};
		mockNext = jest.fn();
	});

	describe('execute', () => {
		it('should validate request body successfully when schema matches', () => {
			const schema = z.object({
				test: z.string(),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'body');

			mockRequest = {
				body: {
					test: 'valid string',
				},
			};

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should return 422 status when request body fails validation', () => {
			const schema = z.object({
				test: z.number(),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'body');

			mockRequest = {
				body: {
					test: 'not a number',
				},
			};

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockResponse.status).toHaveBeenCalledWith(422);
			expect(mockResponse.send).toHaveBeenCalledWith(expect.any(Array));
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should validate query parameters successfully when type is set to query', () => {
			const schema = z.object({
				page: z.coerce.number().min(1).optional(),
				limit: z.coerce.number().min(1).max(100).optional(),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'query');

			mockRequest = {
				query: {
					page: '2',
					limit: '50',
				},
			};

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should validate URL parameters successfully when type is set to params', () => {
			const schema = z.object({
				id: z.coerce.number().min(1),
				slug: z.string().min(3),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'params');

			mockRequest = {
				params: {
					id: '42',
					slug: 'test-slug',
				},
			};

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should call next middleware when data to validate is an empty object', () => {
			const schema = z.object({
				test: z.string(),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'body');

			mockRequest = {
				body: {},
			};

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should throw an error when an invalid validation type is provided', () => {
			const schema = z.object({
				test: z.string(),
			});
			const invalidType = 'invalid' as ValidationType;
			const validateMiddleware = new ValidateMiddleware(schema, invalidType);

			mockRequest = {
				body: { test: 'value' },
				query: {},
				params: {},
			};

			expect(() => {
				validateMiddleware.execute(mockRequest as Request, mockResponse as Response, mockNext);
			}).toThrow('Invalid validation type: invalid');

			expect(mockNext).not.toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should handle multiple validation errors and return all error messages', () => {
			const schema = z.object({
				name: z.string().min(3),
				age: z.number().min(18),
				email: z.string().email(),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'body');

			mockRequest = {
				body: {
					name: 'Jo',
					age: 16,
					email: 'invalid-email',
				},
			};

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockResponse.status).toHaveBeenCalledWith(422);
			expect(mockResponse.send).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						path: 'name',
						message: 'String must contain at least 3 character(s)',
					}),
					expect.objectContaining({
						path: 'age',
						message: 'Number must be greater than or equal to 18',
					}),
					expect.objectContaining({
						path: 'email',
						message: 'Invalid email',
					}),
				])
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should correctly validate nested objects in the request body', () => {
			const schema = z.object({
				user: z.object({
					name: z.string(),
					age: z.number(),
					address: z.object({
						street: z.string(),
						city: z.string(),
					}),
				}),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'body');

			mockRequest = {
				body: {
					user: {
						name: 'John Doe',
						age: 30,
						address: {
							street: '123 Main St',
							city: 'Anytown',
						},
					},
				},
			};

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should pass validation when optional fields are not provided in the request', () => {
			const schema = z.object({
				requiredField: z.string(),
				optionalField: z.number().optional(),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'body');

			mockRequest = {
				body: {
					requiredField: 'test',
				},
			};

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});
	});
});
