import '../helpers/mock-inversify';

import { BaseController } from '../../common/base.controller';
import { createMockResponse } from '../helpers/http-test-utils';

describe('BaseController', () => {
	const logger = {
		warn: jest.fn(),
		debug: jest.fn(),
		log: jest.fn(),
		error: jest.fn(),
		silly: jest.fn(),
		setContext: jest.fn(),
	} as any;

	class TestController extends BaseController {
		constructor() {
			super(logger);
		}
	}

	it('formats JSON responses with the expected status codes', () => {
		const controller = new TestController();

		const okResponse = createMockResponse();
		controller.ok(okResponse, { success: true });
		expect(okResponse.type).toHaveBeenCalledWith('application/json');
		expect(okResponse.status).toHaveBeenCalledWith(200);
		expect(okResponse.json).toHaveBeenCalledWith({ success: true });

		const badRequestResponse = createMockResponse();
		controller.badRequest(badRequestResponse, 'Bad input');
		expect(badRequestResponse.status).toHaveBeenCalledWith(400);
		expect(badRequestResponse.json).toHaveBeenCalledWith({ message: 'Bad input' });

		const unauthorizedResponse = createMockResponse();
		controller.unauthorized(unauthorizedResponse, 'No auth');
		expect(unauthorizedResponse.status).toHaveBeenCalledWith(401);
		expect(unauthorizedResponse.json).toHaveBeenCalledWith({ message: 'No auth' });

		const forbiddenResponse = createMockResponse();
		controller.forbidden(forbiddenResponse, 'Nope');
		expect(forbiddenResponse.status).toHaveBeenCalledWith(403);
		expect(forbiddenResponse.json).toHaveBeenCalledWith({ message: 'Nope' });

		const notFoundResponse = createMockResponse();
		controller.notFound(notFoundResponse, 'Missing');
		expect(notFoundResponse.status).toHaveBeenCalledWith(404);
		expect(notFoundResponse.json).toHaveBeenCalledWith({ message: 'Missing' });

		const serverErrorResponse = createMockResponse();
		controller.internalServerError(serverErrorResponse, 'Boom');
		expect(serverErrorResponse.status).toHaveBeenCalledWith(500);
		expect(serverErrorResponse.json).toHaveBeenCalledWith({ message: 'Boom' });
	});

	it('sets cookies and sends status-only responses', () => {
		const controller = new TestController();

		const cookieResponse = createMockResponse();
		controller.cookie(cookieResponse, 'profile', { id: 1 }, { httpOnly: true });
		expect(cookieResponse.cookie).toHaveBeenCalledWith('profile', JSON.stringify({ id: 1 }), {
			httpOnly: true,
		});

		const createdResponse = createMockResponse();
		controller.created(createdResponse);
		expect(createdResponse.sendStatus).toHaveBeenCalledWith(201);

		const noContentResponse = createMockResponse();
		controller.noContent(noContentResponse);
		expect(noContentResponse.sendStatus).toHaveBeenCalledWith(204);
	});
});