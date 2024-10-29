import { CookieOptions, Response } from 'express';
import { Container } from 'inversify';
import NodeCache from 'node-cache';
import 'reflect-metadata';
import { ILogger } from '../services/logger/logger.service.interface';
import { TYPES } from '../types';
import { BaseController } from './base.controller';
import { IControllerRoute } from './route.interface';

class TestController extends BaseController {
	public testBindRoutes(routes: any[]) {
		this.bindRoutes(routes);
	}
}

describe('BaseController', () => {
	let container: Container;
	let testController: TestController;
	let mockLogger: jest.Mocked<ILogger>;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		container = new Container();
		mockLogger = {
			log: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
			silly: jest.fn(),
			setContext: jest.fn(),
		} as jest.Mocked<ILogger>;

		container.bind<ILogger>(TYPES.ILogger).toConstantValue(mockLogger);
		container.bind<TestController>(TestController).toSelf();

		testController = container.get<TestController>(TestController);
		mockResponse = {
			type: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			sendStatus: jest.fn().mockReturnThis(),
		};
	});

	describe('Init', () => {
		it('should correctly initialize the BaseController with a logger and create a router', () => {
			const mockLogger = {
				log: jest.fn(),
				error: jest.fn(),
				warn: jest.fn(),
				debug: jest.fn(),
				silly: jest.fn(),
				setContext: jest.fn(),
			};

			class TestController extends BaseController {
				constructor(logger: ILogger) {
					super(logger);
				}
			}

			const testController = new TestController(mockLogger);

			expect(testController).toBeInstanceOf(BaseController);
			expect(testController['logger']).toBe(mockLogger);
			expect(testController['context']).toBe('TestController');
			expect(typeof testController.router).toBe('function');
			expect(testController.router).toHaveProperty('get');
			expect(testController.router).toHaveProperty('post');
			expect(testController.router).toHaveProperty('put');
			expect(testController.router).toHaveProperty('delete');
			expect(testController.cache).toBeInstanceOf(NodeCache);
			expect(testController.cache.options.stdTTL).toBe(60);
			expect(testController.cache.options.checkperiod).toBe(120);
		});

		it('should return the router instance when the "router" getter is called', () => {
			const mockLogger = {
				log: jest.fn(),
				error: jest.fn(),
				warn: jest.fn(),
				debug: jest.fn(),
				silly: jest.fn(),
				setContext: jest.fn(),
			};

			class TestController extends BaseController {
				constructor(logger: ILogger) {
					super(logger);
				}
			}

			const testController = new TestController(mockLogger);

			expect(testController.router).toBeDefined();
			expect(typeof testController.router).toBe('function');
			expect(testController.router).toHaveProperty('get');
			expect(testController.router).toHaveProperty('post');
			expect(testController.router).toHaveProperty('put');
			expect(testController.router).toHaveProperty('delete');
		});

		it('should return the cache instance when the "cache" getter is called', () => {
			const mockLogger = {
				log: jest.fn(),
				error: jest.fn(),
				warn: jest.fn(),
				debug: jest.fn(),
				silly: jest.fn(),
				setContext: jest.fn(),
			};

			class TestController extends BaseController {
				constructor(logger: ILogger) {
					super(logger);
				}
			}

			const testController = new TestController(mockLogger);

			expect(testController.cache).toBeDefined();
			expect(testController.cache).toBeInstanceOf(NodeCache);
			expect(testController.cache.options.stdTTL).toBe(60);
			expect(testController.cache.options.checkperiod).toBe(120);
		});
	});

	describe('Send response', () => {
		it('should send a JSON response with the correct status code and message', () => {
			const mockResponse = {
				type: jest.fn().mockReturnThis(),
				status: jest.fn().mockReturnThis(),
				json: jest.fn().mockReturnThis(),
			} as unknown as Response;

			const testController = new TestController(mockLogger);
			const testMessage = { key: 'value' };
			const testStatusCode = 201;

			testController.send(mockResponse, testStatusCode, testMessage);

			expect(mockResponse.type).toHaveBeenCalledWith('application/json');
			expect(mockResponse.status).toHaveBeenCalledWith(testStatusCode);
			expect(mockResponse.json).toHaveBeenCalledWith(testMessage);
		});

		it('should set a cookie with the provided key, value, and options', () => {
			const mockResponse = {
				cookie: jest.fn().mockReturnThis(),
			} as unknown as Response;

			const testController = new TestController(mockLogger);
			const key = 'testCookie';
			const value = { foo: 'bar' };
			const options: CookieOptions = { maxAge: 3600000, httpOnly: true };

			testController.cookie(mockResponse, key, value, options);

			expect(mockResponse.cookie).toHaveBeenCalledWith(key, JSON.stringify(value), options);
		});

		it('should send a 201 Created status response when "created" method is called', () => {
			const mockResponse = {
				sendStatus: jest.fn().mockReturnThis(),
			} as unknown as Response;

			testController.created(mockResponse);

			expect(mockResponse.sendStatus).toHaveBeenCalledWith(201);
		});

		it('should send a 204 No Content status response when "noContent" method is called', () => {
			const mockResponse = {
				sendStatus: jest.fn().mockReturnThis(),
			} as unknown as Response;

			testController.noContent(mockResponse);

			expect(mockResponse.sendStatus).toHaveBeenCalledWith(204);
		});

		it('should send a 400 Bad Request response with a custom message', () => {
			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn().mockReturnThis(),
				type: jest.fn().mockReturnThis(),
			} as unknown as Response;

			const customMessage = 'Custom Bad Request Message';
			testController.badRequest(mockResponse, customMessage);

			expect(mockResponse.type).toHaveBeenCalledWith('application/json');
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: customMessage });
		});

		it('should send a 404 Not Found response with the default message', () => {
			const mockResponse = {
				type: jest.fn().mockReturnThis(),
				status: jest.fn().mockReturnThis(),
				json: jest.fn().mockReturnThis(),
			} as unknown as Response;

			testController.notFound(mockResponse);

			expect(mockResponse.type).toHaveBeenCalledWith('application/json');
			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not Found' });
		});

		it('should bind routes with middleware and log each route binding', () => {
			const mockLogger = {
				log: jest.fn(),
			} as unknown as ILogger;

			class TestController extends BaseController {
				constructor(logger: ILogger) {
					super(logger);
				}

				public testBindRoutes(routes: IControllerRoute[]) {
					this.bindRoutes(routes);
				}
			}

			const testController = new TestController(mockLogger);

			const mockMiddleware = {
				execute: jest.fn(),
			};

			const mockRoutes: IControllerRoute[] = [
				{
					path: '/test',
					method: 'get',
					func: jest.fn(),
					middlewares: [mockMiddleware],
				},
				{
					path: '/test2',
					method: 'post',
					func: jest.fn(),
				},
			];

			jest.spyOn(testController.router, 'get');
			jest.spyOn(testController.router, 'post');

			testController.testBindRoutes(mockRoutes);

			expect(mockLogger.log).toHaveBeenCalledTimes(2);
			expect(mockLogger.log).toHaveBeenCalledWith('[TestController] \t Binding route: GET /test');
			expect(mockLogger.log).toHaveBeenCalledWith('[TestController] \t Binding route: POST /test2');

			expect(testController.router.get).toHaveBeenCalledWith('/test', [
				expect.any(Function),
				expect.any(Function),
			]);
			expect(testController.router.post).toHaveBeenCalledWith('/test2', [expect.any(Function)]);
		});
	});
});
