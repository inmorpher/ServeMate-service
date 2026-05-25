import '../helpers/mock-dto-package';
import '../helpers/mock-inversify';

import { UserRole } from '../../dto-package';
import { RoleMiddleware } from '../../middleware/role/role.middleware';
import { createMockNext, createMockRequest, createMockResponse } from '../helpers/http-test-utils';

describe('RoleMiddleware', () => {
	it('returns 401 when the request has no user', () => {
		const middleware = new RoleMiddleware([UserRole.ADMIN]);
		const req = createMockRequest();
		const res = createMockResponse();
		const next = createMockNext();

		middleware.execute(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
		expect(next).not.toHaveBeenCalled();
	});

	it('allows users with an allowed role', () => {
		const middleware = new RoleMiddleware([UserRole.ADMIN, UserRole.MANAGER]);
		const req = createMockRequest({ user: { id: 1, email: 'admin@example.com', role: UserRole.ADMIN } } as any);
		const res = createMockResponse();
		const next = createMockNext();

		middleware.execute(req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(res.status).not.toHaveBeenCalled();
	});

	it('returns 403 when the user role is forbidden', () => {
		const middleware = new RoleMiddleware([UserRole.MANAGER]);
		const req = createMockRequest({ user: { id: 1, email: 'admin@example.com', role: UserRole.ADMIN } } as any);
		const res = createMockResponse();
		const next = createMockNext();

		middleware.execute(req, res, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.send).toHaveBeenCalledWith({ error: 'Forbidden' });
		expect(next).not.toHaveBeenCalled();
	});

	it('allows access when no roles are configured', () => {
		const middleware = new RoleMiddleware([]);
		const req = createMockRequest({ user: { id: 1, email: 'user@example.com', role: UserRole.USER } } as any);
		const res = createMockResponse();
		const next = createMockNext();

		middleware.execute(req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(res.status).not.toHaveBeenCalled();
	});
});