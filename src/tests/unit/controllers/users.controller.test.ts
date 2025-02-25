import { NextFunction, Response } from 'express';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TypedRequest } from '../../../common/route.interface';
import { UserController } from '../../../controllers/users/users.controller';

import {
	CreateUser,
	UpdateUserDto,
	UserListResult,
	UserRole,
	UserSearchCriteria,
} from '@servemate/dto';
import { ILogger } from '../../../services/logger/logger.service.interface';
import { UserService } from '../../../services/users/user.service';
import { TYPES } from '../../../types';

describe('UserController', () => {
	let userController: UserController;
	let userService: jest.Mocked<UserService>;
	let loggerService: jest.Mocked<ILogger>;
	let res: Partial<Response>;
	let next: NextFunction;
	let okSpy: jest.SpyInstance;

	beforeEach(() => {
		// Mock services
		userService = {
			findUsers: jest.fn(),
			createUser: jest.fn(),
			deleteUser: jest.fn(),
			updateUser: jest.fn(),
		} as any;

		loggerService = {
			log: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
		} as any;

		// Initialize controller with mocked services
		const container = new Container();
		container.bind<ILogger>(TYPES.ILogger).toConstantValue(loggerService);
		container.bind<UserService>(TYPES.UserService).toConstantValue(userService);

		userController = new UserController(loggerService, userService);

		// Setup response mock
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		// Spy on controller's ok method
		const mockResponse = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(),
		} as unknown as Response;

		okSpy = jest.spyOn(userController, 'ok').mockImplementation(() => mockResponse);

		next = jest.fn();
	});

	describe('getUsers', () => {
		it('should return list of users successfully', async () => {
			const mockResult: UserListResult = {
				users: [
					{
						id: 1,
						name: 'Test User',
						email: 'test@example.com',
						role: UserRole.USER,
						isActive: true,
						lastLogin: new Date(),
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				],
				totalCount: 1,
				page: 1,
				pageSize: 10,
				totalPages: 1,
			};

			const criteria: UserSearchCriteria = {
				page: 1,
				pageSize: 10,
				sortBy: 'name',
				sortOrder: 'asc',
			};

			const req = {
				query: criteria,
			} as TypedRequest<{}, UserSearchCriteria, {}>;

			userService.findUsers.mockResolvedValue(mockResult);

			await userController.getUsers(req, res as Response, next);

			expect(userService.findUsers).toHaveBeenCalledWith(criteria, 1, 10, 'name', 'asc');
			expect(okSpy).toHaveBeenCalledWith(res, mockResult);
		});

		it('should handle errors when getting users', async () => {
			const error = new Error('Database error');
			const req = {
				query: {},
			} as TypedRequest<{}, UserSearchCriteria, {}>;

			userService.findUsers.mockRejectedValue(error);

			await userController.getUsers(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});

		it('should handle all query parameters correctly', async () => {
			const criteria: UserSearchCriteria = {
				id: 1,
				email: 'test@example.com',
				name: 'Test',
				role: UserRole.USER,
				isActive: true,
				createdAfter: '2024-01-01',
				createdBefore: '2024-12-31',
				page: 2,
				pageSize: 20,
				sortBy: 'email',
				sortOrder: 'desc',
			};

			const req = {
				query: criteria,
			} as TypedRequest<{}, UserSearchCriteria, {}>;

			const mockResult: UserListResult = {
				users: [],
				totalCount: 0,
				page: 2,
				pageSize: 20,
				totalPages: 0,
			};

			userService.findUsers.mockResolvedValue(mockResult);

			await userController.getUsers(req, res as Response, next);

			expect(userService.findUsers).toHaveBeenCalledWith(criteria, 2, 20, 'email', 'desc');
			expect(okSpy).toHaveBeenCalledWith(res, mockResult);
		});

		it('should use default values when optional parameters are not provided', async () => {
			const req = {
				query: {},
			} as TypedRequest<{}, UserSearchCriteria, {}>;

			const mockResult: UserListResult = {
				users: [],
				totalCount: 0,
				page: 1,
				pageSize: 10,
				totalPages: 0,
			};

			userService.findUsers.mockResolvedValue(mockResult);

			await userController.getUsers(req, res as Response, next);

			expect(userService.findUsers).toHaveBeenCalledWith({}, 1, 10, 'name', 'asc');
			expect(okSpy).toHaveBeenCalledWith(res, mockResult);
		});
	});

	describe('createUser', () => {
		it('should create user successfully', async () => {
			const createUserData: CreateUser = {
				name: 'New User',
				email: 'new@example.com',
				password: 'password123',
				role: UserRole.USER,
			};

			const createdUser = {
				name: createUserData.name,
				email: createUserData.email,
			};

			const req = {
				body: createUserData,
			} as TypedRequest<{}, {}, CreateUser>;

			userService.createUser.mockResolvedValue(createdUser);

			await userController.createUser(req, res as Response, next);

			expect(userService.createUser).toHaveBeenCalledWith(createUserData);
			expect(loggerService.log).toHaveBeenCalledWith(
				`User ${createdUser.name.toUpperCase()} ${createdUser.email.toLowerCase()} created successfully`
			);
			expect(okSpy).toHaveBeenCalledWith(
				res,
				`User ${createdUser.name.toUpperCase()} ${createdUser.email.toLowerCase()} created successfully`
			);
		});

		it('should handle errors when creating user', async () => {
			const error = new Error('Creation failed');
			const req = {
				body: {
					name: 'New User',
					email: 'new@example.com',
					password: 'password123',
					role: UserRole.USER,
				},
			} as TypedRequest<{}, {}, CreateUser>;

			userService.createUser.mockRejectedValue(error);

			await userController.createUser(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('deleteUser', () => {
		it('should delete user successfully', async () => {
			const req = {
				params: { id: '1' },
			} as TypedRequest<{ id: string | number }>;

			userService.deleteUser.mockResolvedValue(undefined);

			await userController.deleteUser(req, res as Response, next);

			expect(userService.deleteUser).toHaveBeenCalledWith(1);
			expect(okSpy).toHaveBeenCalledWith(res, 'User with ID 1 deleted successfully');
		});

		it('should handle errors when deleting user', async () => {
			const error = new Error('Deletion failed');
			const req = {
				params: { id: '1' },
			} as TypedRequest<{ id: string | number }>;

			userService.deleteUser.mockRejectedValue(error);

			await userController.deleteUser(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});

		it('should handle numeric id parameter', async () => {
			const req = {
				params: { id: 1 },
			} as TypedRequest<{ id: string | number }>;

			userService.deleteUser.mockResolvedValue(undefined);

			await userController.deleteUser(req, res as Response, next);

			expect(userService.deleteUser).toHaveBeenCalledWith(1);
			expect(okSpy).toHaveBeenCalledWith(res, 'User with ID 1 deleted successfully');
		});
	});

	describe('updateUser', () => {
		it('should update user successfully', async () => {
			const updateData: UpdateUserDto = {
				name: 'Updated Name',
				email: 'updated@example.com',
				role: UserRole.MANAGER,
			};

			const req = {
				params: { id: '1' },
				body: updateData,
			} as TypedRequest<{ id: number | string }, {}, UpdateUserDto>;

			userService.updateUser.mockResolvedValue(undefined);

			await userController.updateUser(req, res as Response, next);

			expect(userService.updateUser).toHaveBeenCalledWith(1, updateData);
			expect(okSpy).toHaveBeenCalledWith(res, 'User with ID 1 updated successfully');
		});

		it('should handle errors when updating user', async () => {
			const error = new Error('Update failed');
			const req = {
				params: { id: '1' },
				body: {
					name: 'Updated Name',
				},
			} as TypedRequest<{ id: number | string }, {}, UpdateUserDto>;

			userService.updateUser.mockRejectedValue(error);

			await userController.updateUser(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});

		it('should handle numeric id parameter', async () => {
			const updateData: UpdateUserDto = {
				name: 'Updated Name',
			};

			const req = {
				params: { id: 1 },
				body: updateData,
			} as TypedRequest<{ id: number | string }, {}, UpdateUserDto>;

			userService.updateUser.mockResolvedValue(undefined);

			await userController.updateUser(req, res as Response, next);

			expect(userService.updateUser).toHaveBeenCalledWith(1, updateData);
			expect(okSpy).toHaveBeenCalledWith(res, 'User with ID 1 updated successfully');
		});

		it('should handle all update fields', async () => {
			const updateData: UpdateUserDto = {
				name: 'Updated Name',
				email: 'updated@example.com',
				role: UserRole.MANAGER,
				isActive: false,
				lastLogin: new Date(),
			};

			const req = {
				params: { id: '1' },
				body: updateData,
			} as TypedRequest<{ id: number | string }, {}, UpdateUserDto>;

			userService.updateUser.mockResolvedValue(undefined);

			await userController.updateUser(req, res as Response, next);

			expect(userService.updateUser).toHaveBeenCalledWith(1, updateData);
			expect(okSpy).toHaveBeenCalledWith(res, 'User with ID 1 updated successfully');
		});
	});
});
