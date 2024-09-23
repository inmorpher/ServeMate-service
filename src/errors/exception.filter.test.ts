import { NextFunction, Request, Response } from 'express';
import 'reflect-metadata';
import { ILogger } from '../logger/logger.service.interface';
import { ExceptionFilter } from './exception.filter';
import { IExceptionFilter } from './exception.filter.interface';
import { HTTPError } from './http-error.class';

describe('ExceptionFilter', () => {
	let exceptionFilter: IExceptionFilter;
	let mockLogger: ILogger;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		mockLogger = {
			log: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
			silly: jest.fn(),
		};
		exceptionFilter = new ExceptionFilter(mockLogger);
		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};
		mockNext = jest.fn();
	});

	describe('catch', () => {
		it('should log and respond with correct status code and message for HTTPError', () => {
			const httpError = new HTTPError(400, 'Bad Request', 'test');
			exceptionFilter.catch(httpError, mockRequest as Request, mockResponse as Response, mockNext);
			expect(mockLogger.error).toHaveBeenCalledWith('[Bad Request] Error 400 : test');
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({ error: 'test' });
		});

		it('should log and respond with 500 status code for non-HTTPError errors', () => {
			const error = new Error('Test error');
			exceptionFilter.catch(error, mockRequest as Request, mockResponse as Response, mockNext);
			expect(mockLogger.error).toHaveBeenCalledWith('[undefined] Error : Test error');
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({ error: 'An unknown error occurred' });
		});
	});
});
