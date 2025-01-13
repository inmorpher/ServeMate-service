import { NextFunction, Request, Response } from 'express';
import 'reflect-metadata';

import { Role } from '../../dto/enums';
import { RoleMiddleware } from './role.middleware';

jest.mock('../../../env', () => ({ ENV: { PRODUCTION: true } }));
describe('RoleMiddleware', () => {
	let roleMiddleware: RoleMiddleware;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;

	beforeEach(() => {
		roleMiddleware = new RoleMiddleware([Role.ADMIN]);
		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};
		nextFunction = jest.fn();
	});

	describe('execute', () => {
		it('should allow access for a user with the correct role', () => {
			const adminRoleMiddleware = new RoleMiddleware([Role.ADMIN]);
			mockRequest.user = { id: 1, email: 'test@email.com', role: Role.ADMIN };

			adminRoleMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(nextFunction).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should deny access with a 401 status for requests without a user', () => {
			const roleMiddleware = new RoleMiddleware([Role.ADMIN]);
			mockRequest = {};

			roleMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
			expect(nextFunction).not.toHaveBeenCalled();
		});

		it('should deny access with a 403 status for users with an incorrect role', () => {
			const roleMiddleware = new RoleMiddleware([Role.ADMIN]);
			mockRequest.user = { id: 1, email: 'test@email.com', role: Role.USER };

			roleMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Forbidden' });
			expect(nextFunction).not.toHaveBeenCalled();
		});

		it('should call next() for users with the correct role', () => {
			const userRoleMiddleware = new RoleMiddleware([Role.USER]);
			mockRequest.user = { id: 1, email: 'user@email.com', role: Role.USER };

			userRoleMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(nextFunction).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should allow access for a user with one of multiple allowed roles', () => {
			const multiRoleMiddleware = new RoleMiddleware([Role.ADMIN, Role.MANAGER]);
			mockRequest.user = { id: 1, email: 'manager@email.com', role: Role.MANAGER };

			multiRoleMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(nextFunction).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should allow access when the role array is empty', () => {
			const emptyRoleMiddleware = new RoleMiddleware([]);
			mockRequest.user = { id: 1, email: 'user@email.com', role: Role.USER };

			emptyRoleMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(nextFunction).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});

		it('should not modify the request or response objects for valid users', () => {
			const validRoleMiddleware = new RoleMiddleware([Role.USER]);
			const originalUser = { id: 1, email: 'user@email.com', role: Role.USER };
			mockRequest.user = { ...originalUser };
			const originalRequest = { ...mockRequest };
			const originalResponse = { ...mockResponse };

			validRoleMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockRequest).toEqual(originalRequest);
			expect(mockResponse).toEqual(originalResponse);
			expect(mockRequest.user).toEqual(originalUser);
			expect(nextFunction).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.send).not.toHaveBeenCalled();
		});
	});
});
