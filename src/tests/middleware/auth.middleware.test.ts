import '../helpers/mock-dto-package';
import '../helpers/mock-inversify';

import { AuthMiddleware } from '../../middleware/auth/auth.middleware';
import { ITokenService } from '../../services/tokens/token.service.interface';
import { createMockNext, createMockRequest, createMockResponse } from '../helpers/http-test-utils';

describe('AuthMiddleware', () => {
	it('delegates authentication to the token service', () => {
		const tokenService = {
			authenticate: jest.fn(),
		} as unknown as ITokenService;
		const middleware = new AuthMiddleware(tokenService);
		const req = createMockRequest();
		const res = createMockResponse();
		const next = createMockNext();

		middleware.execute(req, res, next);

		expect(tokenService.authenticate).toHaveBeenCalledWith(req, res, next);
	});
});