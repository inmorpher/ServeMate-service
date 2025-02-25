import { Response } from 'express';
import { Container } from 'inversify';
import { BaseController } from '../../../common/base.controller';
import { ILogger } from '../../../services/logger/logger.service.interface';
import { TYPES } from '../../../types';

@Reflect.metadata('prefix', '/test')
class TestController extends BaseController {
	public testRoute() {}
	public testMiddlewareRoute() {}

	constructor(logger: ILogger) {
		super(logger);

		// Define test routes
		Reflect.defineMetadata(
			'routes',
			[
				{
					method: 'get',
					path: '/simple',
					handlerName: 'testRoute',
				},
				{
					method: 'post',
					path: '/with-middleware',
					handlerName: 'testMiddlewareRoute',
					middlewares: [{ execute: (req: any, res: any, next: any) => next() }],
				},
			],
			TestController
		);

		this.bindRoutes();
	}
}

describe('BaseController', () => {
	let controller: TestController;
	let mockLogger: jest.Mocked<ILogger>;
	let mockResponse: jest.Mocked<Response>;
	let container: Container;

	beforeEach(() => {
		mockLogger = {
			log: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			info: jest.fn(),
			debug: jest.fn(),
		} as unknown as jest.Mocked<ILogger>;

		mockResponse = {
			type: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			sendStatus: jest.fn().mockReturnThis(),
			cookie: jest.fn().mockReturnThis(),
		} as unknown as jest.Mocked<Response>;

		container = new Container();
		container.bind<ILogger>(TYPES.ILogger).toConstantValue(mockLogger);

		controller = new TestController(mockLogger);
	});

	describe('Response Methods', () => {
		it('should send response with correct status and message', () => {
			const message = { data: 'test' };
			controller.send(mockResponse, 200, message);

			expect(mockResponse.type).toHaveBeenCalledWith('application/json');
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(message);
		});

		it('should send OK (200) response', () => {
			const message = { data: 'test' };
			controller.ok(mockResponse, message);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(message);
		});

		it('should set cookie with string value', () => {
			controller.cookie(mockResponse, 'testKey', 'testValue');
			expect(mockResponse.cookie).toHaveBeenCalledWith('testKey', 'testValue', {});
		});

		it('should set cookie with object value', () => {
			const value = { test: 'value' };
			controller.cookie(mockResponse, 'testKey', value);
			expect(mockResponse.cookie).toHaveBeenCalledWith('testKey', JSON.stringify(value), {});
		});

		it('should send created (201) response', () => {
			controller.created(mockResponse);
			expect(mockResponse.sendStatus).toHaveBeenCalledWith(201);
		});

		it('should send no content (204) response', () => {
			controller.noContent(mockResponse);
			expect(mockResponse.sendStatus).toHaveBeenCalledWith(204);
		});

		it('should send bad request (400) response', () => {
			controller.badRequest(mockResponse, 'Bad Request Message');
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bad Request Message' });
		});

		it('should send unauthorized (401) response', () => {
			controller.unauthorized(mockResponse, 'Unauthorized Message');
			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized Message' });
		});

		it('should send forbidden (403) response', () => {
			controller.forbidden(mockResponse, 'Forbidden Message');
			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Forbidden Message' });
		});

		it('should send not found (404) response', () => {
			controller.notFound(mockResponse, 'Not Found Message');
			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not Found Message' });
		});

		it('should send internal server error (500) response', () => {
			controller.internalServerError(mockResponse, 'Error Message');
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error Message' });
		});
	});

	describe('Cache', () => {
		it('should return cache instance', () => {
			const cache = controller.cache;
			expect(cache).toBeDefined();
			expect(typeof cache.set).toBe('function');
			expect(typeof cache.get).toBe('function');
		});
	});

	describe('Router', () => {
		it('should have router instance', () => {
			expect(controller.router).toBeDefined();
			expect(typeof controller.router.get).toBe('function');
			expect(typeof controller.router.post).toBe('function');
		});
	});

	describe('Default Messages', () => {
		it('should use default message for badRequest', () => {
			controller.badRequest(mockResponse);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bad Request' });
		});

		it('should use default message for unauthorized', () => {
			controller.unauthorized(mockResponse);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
		});

		it('should use default message for forbidden', () => {
			controller.forbidden(mockResponse);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Forbidden' });
		});

		it('should use default message for notFound', () => {
			controller.notFound(mockResponse);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not Found' });
		});

		it('should use default message for internalServerError', () => {
			controller.internalServerError(mockResponse);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
		});
	});

	describe('Route Binding', () => {
		it('should bind routes with prefix', () => {
			const routes = controller.router.stack;
			expect(routes).toBeDefined();
			expect(routes.length).toBeGreaterThan(0);

			const simpleRoute = routes.find((r) => r.route?.path === '/test/simple');
			expect(simpleRoute).toBeDefined();
			expect(simpleRoute?.route?.stack[0].method).toBe('get');
		});

		it('should bind routes with middleware', () => {
			const routes = controller.router.stack;
			const middlewareRoute = routes.find((r) => r.route?.path === '/test/with-middleware');

			expect(middlewareRoute).toBeDefined();
			expect(middlewareRoute?.route?.stack[0].method).toBe('post');
			expect(middlewareRoute?.route?.stack.length).toBeGreaterThan(1); // Should have middleware + handler
		});

		it('should log debug messages when binding routes', () => {
			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.stringContaining('Registered route: GET /test/simple')
			);
			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.stringContaining('Registered route: POST /test/with-middleware')
			);
		});

		it('should handle invalid route definitions', () => {
			class InvalidRouteController extends BaseController {
				constructor(logger: ILogger) {
					super(logger);
					this.bindRoutes();
				}
			}

			// Define invalid route before creating the controller
			Reflect.defineMetadata(
				'routes',
				[{ method: 'get', path: '/invalid' }],
				InvalidRouteController
			);

			const newController = new InvalidRouteController(mockLogger);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.stringContaining('Invalid route definition')
			);
		});
	});
});
