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
			name: z.string(),
			age: z.number(),
		});
		validateMiddleware = new ValidateMiddleware(schema);
		mockRequest = {
			body: {},
		};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};
		nextFunction = jest.fn();
	});

	describe('execute', () => {
		it('should validate request body successfully when valid data is provided', () => {
			const schema = z.object({
				name: z.string(),
				age: z.number(),
			});
			validateMiddleware = new ValidateMiddleware(schema);
			mockRequest.body = { name: 'John Doe', age: 30 };

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(nextFunction).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should return 422 status code when request body fails validation', () => {
			const schema = z.object({
				name: z.string(),
				age: z.number(),
			});
			validateMiddleware = new ValidateMiddleware(schema);
			mockRequest.body = { name: 'John Doe', age: 'thirty' };

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockResponse.status).toHaveBeenCalledWith(422);
			expect(mockResponse.send).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						code: 'invalid_type',
						expected: 'number',
						received: 'string',
						path: ['age'],
					}),
				])
			);
			expect(nextFunction).not.toHaveBeenCalled();
		});

		it('should validate query parameters successfully when valid data is provided', () => {
			const schema = z.object({
				page: z.string(),
				limit: z.string(),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'query');
			mockRequest.query = { page: '1', limit: '10' };

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(nextFunction).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should return 422 status code when query parameters fail validation', () => {
			const schema = z.object({
				page: z.number(),
				limit: z.number(),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'query');
			mockRequest.query = { page: 'one', limit: 'ten' };

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockResponse.status).toHaveBeenCalledWith(422);
			expect(mockResponse.send).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						code: 'invalid_type',
						expected: 'number',
						received: 'string',
						path: ['page'],
					}),
					expect.objectContaining({
						code: 'invalid_type',
						expected: 'number',
						received: 'string',
						path: ['limit'],
					}),
				])
			);
			expect(nextFunction).not.toHaveBeenCalled();
		});

		it('should validate URL parameters successfully when valid data is provided', () => {
			const schema = z.object({
				id: z.string(),
				category: z.string(),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'params');
			mockRequest.params = { id: '123', category: 'electronics' };

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(nextFunction).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should return 422 status code when URL parameters fail validation', () => {
			const schema = z.object({
				id: z.number(),
				category: z.string(),
			});
			validateMiddleware = new ValidateMiddleware(schema, 'params');
			mockRequest.params = { id: 'abc', category: '123' };

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockResponse.status).toHaveBeenCalledWith(422);
			expect(mockResponse.send).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						code: 'invalid_type',
						expected: 'number',
						received: 'string',
						path: ['id'],
						message: 'Expected number, received string',
					}),
				])
			);
			expect(nextFunction).not.toHaveBeenCalled();
		});

		it('should throw an error when an invalid validation type is specified', () => {
			const schema = z.object({
				name: z.string(),
			});
			// @ts-ignore - We're intentionally passing an invalid type to test error handling
			const validateMiddleware = new ValidateMiddleware(schema, 'invalidType' as ValidationType);
			const mockRequest = {} as Request;
			const mockResponse = {} as Response;
			const nextFunction = jest.fn();

			expect(() => {
				validateMiddleware.execute(mockRequest, mockResponse, nextFunction);
			}).toThrow('Invalid validation type: invalidType');
		});

		it('should call next() function when validation succeeds', () => {
			const schema = z.object({
				name: z.string(),
				age: z.number(),
			});
			validateMiddleware = new ValidateMiddleware(schema);
			mockRequest.body = { name: 'John Doe', age: 30 };

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(nextFunction).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should include detailed error issues in the response when validation fails', () => {
			const schema = z.object({
				name: z.string(),
				age: z.number().positive(),
				email: z.string().email(),
			});
			validateMiddleware = new ValidateMiddleware(schema);
			mockRequest.body = { name: 123, age: -5, email: 'invalid-email' };

			validateMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockResponse.status).toHaveBeenCalledWith(422);
			expect(mockResponse.send).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						code: 'invalid_type',
						expected: 'string',
						received: 'number',
						path: ['name'],
						message: 'Expected string, received number',
					}),
					expect.objectContaining({
						code: 'too_small',
						minimum: 0,
						type: 'number',
						inclusive: false,
						exact: false,
						path: ['age'],
						message: 'Number must be greater than 0',
					}),
					expect.objectContaining({
						code: 'invalid_string',
						validation: 'email',
						path: ['email'],
						message: 'Invalid email',
					}),
				])
			);
			expect(nextFunction).not.toHaveBeenCalled();
		});

		it('should handle empty request body, query, or params without throwing errors', () => {
			const schema = z.object({
				optionalField: z.string().optional(),
			});
			const validateMiddleware = new ValidateMiddleware(schema);
			const mockRequest = {
				body: {},
				query: {},
				params: {},
			} as Request;
			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
			} as unknown as Response;
			const nextFunction = jest.fn();

			validateMiddleware.execute(mockRequest, mockResponse as Response, nextFunction);

			expect(nextFunction).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});
	});
});
