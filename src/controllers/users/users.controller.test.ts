import { NextFunction, Request, Response } from 'express';
import { Container } from 'inversify';
import 'reflect-metadata';
import { Role, UserListResult, UserParamSchema } from '../../dto/user.dto';
import { ValidateMiddleware } from '../../middleware/validate/validate.middleware';
import { ILogger } from '../../services/logger/logger.service.interface';
import { UserService } from '../../services/users/user.service';
import { TYPES } from '../../types';
import { UserController } from './users.controller';

describe('UserController', () => {
	let container: Container;
	let userController: UserController;
	let mockLogger: jest.Mocked<ILogger>;
	let mockUserService: jest.Mocked<UserService>;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		container = new Container();
		mockLogger = {
			log: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			setContext: jest.fn(),
			debug: jest.fn(),
			silly: jest.fn(),
		} as jest.Mocked<ILogger>;

		mockUserService = {
			findUsers: jest.fn(),
			createUser: jest.fn(),
			deleteUser: jest.fn(),
			updateUser: jest.fn(),
			validateUser: jest.fn(),
		} as Partial<jest.Mocked<UserService>> as jest.Mocked<UserService>;

		container.bind<ILogger>(TYPES.ILogger).toConstantValue(mockLogger);
		container.bind<UserService>(TYPES.UserService).toConstantValue(mockUserService);
		container.bind<UserController>(UserController).toSelf();

		userController = container.get<UserController>(UserController);
		userController.ok = jest.fn();
		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		mockNext = jest.fn();
	});

	describe('getUsers', () => {
		it('should retrieve users with default pagination when no query parameters are provided', async () => {
			const mockRequest = {
				query: {},
			} as Request;
			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			} as unknown as Response;
			const mockNext = jest.fn() as NextFunction;

			const expectedResult: UserListResult = {
				users: [
					{
						id: 1,
						name: 'John Doe',
						email: 'john@example.com',
						role: Role.USER,
						isActive: true,
						createdAt: new Date(),
						updatedAt: new Date(),
						lastLogin: new Date(),
					},
				],
				totalCount: 1,
				page: 1,
				pageSize: 10,
				totalPages: 1,
			};

			mockUserService.findUsers.mockResolvedValue(expectedResult);

			await userController.getUsers(mockRequest, mockResponse, mockNext);

			expect(mockUserService.findUsers).toHaveBeenCalledWith({}, 1, 10, 'name', 'asc');
			expect(userController.ok).toHaveBeenCalledWith(mockResponse, expectedResult);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should filter users by role and return only matching results', async () => {
			const mockRequest = {
				query: {
					role: Role.MANAGER,
				},
			} as unknown as Request;
			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			} as unknown as Response;
			const mockNext = jest.fn() as NextFunction;

			const expectedResult = {
				users: [
					{
						id: 1,
						name: 'John Doe',
						email: 'john@example.com',
						role: Role.MANAGER,
						isActive: true,
						createdAt: new Date(),
						updatedAt: new Date(),
						lastLogin: new Date(),
					},
				],
				totalCount: 1,
				page: 1,
				pageSize: 10,
				totalPages: 1,
			};

			mockUserService.findUsers.mockResolvedValue(expectedResult);

			await userController.getUsers(mockRequest, mockResponse, mockNext);

			expect(mockUserService.findUsers).toHaveBeenCalledWith(
				{ role: Role.MANAGER },
				1,
				10,
				'name',
				'asc'
			);
			expect(userController.ok).toHaveBeenCalledWith(mockResponse, expectedResult);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should sort users by a specified column in ascending and descending order', async () => {
			const mockRequest = {
				query: {
					sortBy: 'email',
					sortOrder: 'desc',
				},
			} as unknown as Request;
			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			} as unknown as Response;
			const mockNext = jest.fn() as NextFunction;

			const expectedResultDesc: UserListResult = {
				users: [
					{
						id: 2,
						name: 'Zoe Smith',
						email: 'zoe@example.com',
						role: Role.USER,
						isActive: true,
						createdAt: new Date('2023-05-02T10:00:00Z'),
						updatedAt: new Date('2023-05-02T10:00:00Z'),
						lastLogin: new Date('2023-05-02T11:00:00Z'),
					},
					{
						id: 1,
						name: 'Alice Johnson',
						email: 'alice@example.com',
						role: Role.ADMIN,
						isActive: true,
						createdAt: new Date('2023-05-01T09:00:00Z'),
						updatedAt: new Date('2023-05-01T09:00:00Z'),
						lastLogin: new Date('2023-05-02T08:30:00Z'),
					},
				],
				totalCount: 2,
				page: 1,
				pageSize: 10,
				totalPages: 1,
			};

			mockUserService.findUsers.mockResolvedValueOnce(expectedResultDesc);

			await userController.getUsers(mockRequest, mockResponse, mockNext);

			expect(mockUserService.findUsers).toHaveBeenCalledWith(
				{ sortBy: 'email', sortOrder: 'desc' },
				1,
				10,
				'email',
				'desc'
			);
			expect(userController.ok).toHaveBeenCalledWith(mockResponse, expectedResultDesc);

			// Test ascending order
			mockRequest.query.sortOrder = 'asc';
			const expectedResultAsc: UserListResult = {
				users: [
					{
						id: 1,
						name: 'Alice Johnson',
						email: 'alice@example.com',
						role: Role.ADMIN,
						isActive: true,
						createdAt: new Date('2023-05-01T09:00:00Z'),
						updatedAt: new Date('2023-05-01T09:00:00Z'),
						lastLogin: new Date('2023-05-02T08:30:00Z'),
					},
					{
						id: 2,
						name: 'Zoe Smith',
						email: 'zoe@example.com',
						role: Role.USER,
						isActive: true,
						createdAt: new Date('2023-05-02T10:00:00Z'),
						updatedAt: new Date('2023-05-02T10:00:00Z'),
						lastLogin: new Date('2023-05-02T11:00:00Z'),
					},
				],
				totalCount: 2,
				page: 1,
				pageSize: 10,
				totalPages: 1,
			};

			mockUserService.findUsers.mockResolvedValueOnce(expectedResultAsc);

			await userController.getUsers(mockRequest, mockResponse, mockNext);

			expect(mockUserService.findUsers).toHaveBeenCalledWith(
				{ sortBy: 'email', sortOrder: 'asc' },
				1,
				10,
				'email',
				'asc'
			);
			expect(userController.ok).toHaveBeenCalledWith(mockResponse, expectedResultAsc);

			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should handle invalid query parameters', () => {
			const mockRequest = {
				query: {
					page: 'invalid',
					pageSize: 'invalid',
					sortBy: 'invalidColumn',
					sortOrder: 'invalid',
				},
			} as unknown as Request;
			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
			} as unknown as Response;
			const mockNext = jest.fn() as NextFunction;

			const validateMiddleware = new ValidateMiddleware(UserParamSchema, 'query');

			validateMiddleware.execute(mockRequest, mockResponse, mockNext);

			expect(mockResponse.status).toHaveBeenCalledWith(422);
			expect(mockResponse.send).toHaveBeenCalledWith(expect.any(Array));
			expect(mockNext).not.toHaveBeenCalled();

			expect(mockUserService.findUsers).not.toHaveBeenCalled();
			expect(userController.ok).not.toHaveBeenCalled();
		});
	});

	describe('createUser', () => {
		it('should create a new user with valid input data and return a success message', async () => {
			const mockRequest = {
				body: {
					name: 'John Doe',
					email: 'john@example.com',
					role: Role.USER,
					password: 'password123',
				},
			} as Request;
			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			} as unknown as Response;
			const mockNext = jest.fn() as NextFunction;

			const createdUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				role: Role.USER,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockUserService.createUser.mockResolvedValue(createdUser);

			await userController.createUser(mockRequest, mockResponse, mockNext);

			expect(mockUserService.createUser).toHaveBeenCalledWith({
				name: 'John Doe',
				email: 'john@example.com',
				role: Role.USER,
				password: 'password123',
			});
			expect(mockLogger.log).toHaveBeenCalledWith(
				'User JOHN DOE john@example.com created successfully'
			);
			expect(userController.ok).toHaveBeenCalledWith(
				mockResponse,
				'User JOHN DOE john@example.com created successfully'
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return an error when trying to create a user without proper role permissions', async () => {
			const mockRequest = {
				body: {
					name: 'John Doe',
					email: 'john@example.com',
					role: Role.USER,
					password: 'password123',
				},
			} as Request;

			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			} as unknown as Response;

			const mockNext = jest.fn() as NextFunction;

			const mockError = new Error('Unauthorized: Insufficient role permissions');
			mockUserService.createUser.mockRejectedValue(mockError);

			await userController.createUser(mockRequest, mockResponse, mockNext);

			expect(mockUserService.createUser).toHaveBeenCalledWith({
				name: 'John Doe',
				email: 'john@example.com',
				role: Role.USER,
				password: 'password123',
			});
			expect(mockNext).toHaveBeenCalledWith(mockError);
			expect(mockLogger.log).toHaveBeenCalled();
			expect(userController.ok).not.toHaveBeenCalled();
		});
	});

	describe('deleteUser', () => {
		it('should delete a user by ID and return a success message', async () => {
			const userId = 1;
			const mockRequest = {
				params: { id: userId.toString() },
			} as unknown as Request;
			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			} as unknown as Response;
			const mockNext = jest.fn() as NextFunction;

			mockUserService.deleteUser.mockResolvedValue(undefined);

			await userController.deleteUser(mockRequest, mockResponse, mockNext);

			expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
			expect(userController.ok).toHaveBeenCalledWith(
				mockResponse,
				`User with ID ${userId} deleted successfully`
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return an error when trying to delete a non-existent user', async () => {
			const mockRequest = {
				params: { id: '999' },
			} as unknown as Request;
			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			} as unknown as Response;
			const mockNext = jest.fn() as NextFunction;

			const error = new Error('User not found');
			mockUserService.deleteUser.mockRejectedValue(error);

			await userController.deleteUser(mockRequest, mockResponse, mockNext);

			expect(mockUserService.deleteUser).toHaveBeenCalledWith(999);
			expect(mockNext).toHaveBeenCalledWith(error);
			expect(userController.ok).not.toHaveBeenCalled();
		});
	});

	describe('updateUser', () => {
		it("should update a user's information and return a success message", async () => {
			const mockRequest = {
				params: { id: '1' },
				body: { name: 'Updated Name', email: 'updated@example.com' },
			} as unknown as Request;
			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			} as unknown as Response;
			const mockNext = jest.fn() as NextFunction;

			mockUserService.updateUser.mockResolvedValue(undefined);

			await userController.updateUser(mockRequest, mockResponse, mockNext);

			expect(mockUserService.updateUser).toHaveBeenCalledWith(1, {
				name: 'Updated Name',
				email: 'updated@example.com',
			});
			expect(userController.ok).toHaveBeenCalledWith(
				mockResponse,
				'User with ID 1 updated successfully'
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should handle concurrent requests to create and update users without conflicts', async () => {
			const createUserData = {
				name: 'John Doe',
				email: 'john@example.com',
				role: Role.USER,
				password: 'password123',
			};

			const updateUserData = {
				name: 'Jane Doe',
				email: 'jane@example.com',
			};

			const createRequest = {
				body: createUserData,
			} as Request;

			const updateRequest = {
				params: { id: '1' },
				body: updateUserData,
			} as unknown as Request;

			const mockResponse = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			} as unknown as Response;

			const mockNext = jest.fn() as NextFunction;

			mockUserService.createUser.mockResolvedValue({
				...createUserData,
			});

			mockUserService.updateUser.mockResolvedValue(undefined);

			const createPromise = userController.createUser(createRequest, mockResponse, mockNext);
			const updatePromise = userController.updateUser(updateRequest, mockResponse, mockNext);

			await Promise.all([createPromise, updatePromise]);

			expect(mockUserService.createUser).toHaveBeenCalledWith(createUserData);
			expect(mockUserService.updateUser).toHaveBeenCalledWith(1, updateUserData);
			expect(userController.ok).toHaveBeenCalledTimes(2);
			expect(mockNext).not.toHaveBeenCalled();
		});
	});
});
