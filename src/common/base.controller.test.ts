import { Response } from 'express';

import 'reflect-metadata';
import { ILogger } from '../logger/logger.service.interface';
import { BaseController } from './base.constroller';
import { IControllerRoute } from './route.interface';
class TestController extends BaseController {
	constructor(logger: ILogger) {
		super(logger);
	}

	public testBindRoutes(routes: IControllerRoute[]) {
		this.bindRoutes(routes);
	}
}

describe('BaseController', () => {
	let controller: TestController;
	let mockLogger: ILogger;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		mockLogger = {
			log: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
			silly: jest.fn(),
		};
		controller = new TestController(mockLogger);
		mockResponse = {
			type: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			sendStatus: jest.fn().mockReturnThis(),
		};
	});

	describe('send', () => {
		it('should set content type and send JSON response', () => {
			controller.send(mockResponse as Response, 200, { message: 'Test' });
			expect(mockResponse.type).toHaveBeenCalledWith('application/json');
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Test' });
		});
	});

	describe('ok', () => {
		it('should send a 200 response', () => {
			controller.ok(mockResponse as Response, { message: 'Success' });
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Success' });
		});
	});

	describe('bindRoutes', () => {
		it('should bind routes correctly', () => {
			const routes: IControllerRoute[] = [{ path: '/test', method: 'get', func: jest.fn() }];
			controller.testBindRoutes(routes);
			expect(mockLogger.log).toHaveBeenCalledWith('Binding route: GET /test');
		});
	});

	describe('created', () => {
		it('should send a 201 response', () => {
			controller.created(mockResponse as Response);
			expect(mockResponse.sendStatus).toHaveBeenCalledWith(201);
		});
	});

	describe('noContent', () => {
		it('should send a 204 response', () => {
			controller.noContent(mockResponse as Response);
			expect(mockResponse.sendStatus).toHaveBeenCalledWith(204);
		});
	});

	describe('badRequest', () => {
		it('should send a 400 response with a default message', () => {
			controller.badRequest(mockResponse as Response);
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bad Request' });
		});

		it('should send a 400 response with a custom message', () => {
			controller.badRequest(mockResponse as Response, 'Custom Error');
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Custom Error' });
		});
	});

	describe('forbidden', () => {
		it('should send a 403 response with a default message', () => {
			controller.forbidden(mockResponse as Response);
			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Forbidden' });
		});

		it('should send a 403 response with a custom message', () => {
			controller.forbidden(mockResponse as Response, 'Custom Forbidden');
			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Custom Forbidden' });
		});
	});

	describe('unauthorized', () => {
		it('should send a 401 response with a default message', () => {
			controller.unauthorized(mockResponse as Response);
			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
		});

		it('should send a 401 response with a custom message', () => {
			controller.unauthorized(mockResponse as Response, 'Custom Unauthorized');
			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Custom Unauthorized' });
		});
	});

	describe('notFound', () => {
		it('should send a 404 response with a default message', () => {
			controller.notFound(mockResponse as Response);
			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not Found' });
		});

		it('should send a 404 response with a custom message', () => {
			controller.notFound(mockResponse as Response, 'Custom Not Found');
			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Custom Not Found' });
		});
	});

	describe('internalServerError', () => {
		it('should send a 500 response with a default message', () => {
			controller.internalServerError(mockResponse as Response);
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
		});

		it('should send a 500 response with a custom message', () => {
			controller.internalServerError(mockResponse as Response, 'Custom Internal Server Error');
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Custom Internal Server Error' });
		});
	});
});
