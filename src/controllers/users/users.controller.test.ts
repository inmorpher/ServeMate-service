import { NextFunction, Request, Response } from 'express';
import { Container } from 'inversify';
import 'reflect-metadata';
import { Role } from '../../dto/user.dto';
import { ILogger } from '../../services/logger/logger.service.interface';
import { UserService } from '../../services/users/user.service';
import { TYPES } from '../../types';
import { UserController } from './users.controller';

describe('UserController', () => {
	let userController: UserController;
	let mockUserService: jest.Mocked<UserService>;
	let mockLogger: jest.Mocked<ILogger>;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;

	beforeEach(() => {
		mockUserService = {
			findAllUsers: jest.fn(),
			findUser: jest.fn(),
			createUser: jest.fn(),
			deleteUser: jest.fn(),
			updateUser: jest.fn(),
		} as unknown as jest.Mocked<UserService>;

		mockLogger = {
			log: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
			silly: jest.fn(),
			setContext: jest.fn(),
		} as jest.Mocked<ILogger>;

		const container = new Container();
		container.bind<ILogger>(TYPES.ILogger).toConstantValue(mockLogger);
		container.bind<UserService>(TYPES.UserService).toConstantValue(mockUserService);

		userController = new UserController(mockLogger, mockUserService);

		userController.ok = jest.fn();

		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			send: jest.fn().mockReturnThis(),
		};
		nextFunction = jest.fn();
	});

	describe('getAllUsers', () => {
		it('should retrieve all users successfully when the database is populated', async () => {
			const users = [
				{
					id: 1,
					name: 'John Doe',
					email: 'john@example.com',
					role: Role.USER,
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					name: 'Jane Doe',
					email: 'jane@example.com',
					role: Role.ADMIN,
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockUserService.findAllUsers.mockResolvedValue(users);

			await userController.getAllUsers(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(mockUserService.findAllUsers).toHaveBeenCalled();
			expect(userController.ok).toHaveBeenCalledWith(mockResponse, users);
		});

		it('should return an empty array when no users exist in the database', async () => {
			mockUserService.findAllUsers.mockResolvedValue([]);

			await userController.getAllUsers(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(mockUserService.findAllUsers).toHaveBeenCalled();
			expect(userController.ok).toHaveBeenCalledWith(mockResponse, []);
		});
	});

	describe('getUser', () => {
		it('should return user details when queried with a valid email', async () => {
			const user = [
				{
					id: 1,
					name: 'John Doe',
					email: 'john@example.com',
					role: Role.USER,
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockUserService.findUser.mockResolvedValue(user);
			mockRequest.query = { email: 'john@example.com' };

			await userController.getUser(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockUserService.findUser).toHaveBeenCalledWith({ email: 'john@example.com' });
			expect(userController.ok).toHaveBeenCalledWith(mockResponse, user);
		});

		it('should return an error when queried with an invalid user ID format', async () => {
			mockRequest.query = { id: 'invalid-id' };

			await userController.getUser(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockUserService.findUser).toHaveBeenCalledWith({ id: 'invalid-id' });
			expect(userController.ok).toHaveBeenCalledWith(mockResponse, undefined);
		});
	});

	describe('createUser', () => {
		it('should create a new user successfully with valid input data', async () => {
			mockRequest.body = {
				name: 'Alice Smith',
				email: 'alice@example.com',
				role: Role.USER,
				password: 'securePassword123',
			};

			const newUser = {
				id: 3,
				name: 'Alice Smith',
				email: 'alice@example.com',
				role: Role.USER,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockUserService.createUser.mockResolvedValue(newUser);

			await userController.createUser(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(mockUserService.createUser).toHaveBeenCalledWith({
				name: 'Alice Smith',
				email: 'alice@example.com',
				role: Role.USER,
				password: 'securePassword123',
			});
			expect(mockLogger.log).toHaveBeenCalledWith(
				'User ALICE SMITH alice@example.com created successfully'
			);
			expect(userController.ok).toHaveBeenCalledWith(
				mockResponse,
				'User ALICE SMITH alice@example.com created successfully'
			);
		});

		it('should return an error when creating a user with missing required fields', async () => {
			mockRequest.body = {
				name: 'Alice Smith',
				// Missing email, role, and password fields
			};

			await userController.createUser(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
		});
	});

	describe('deleteUser', () => {
		it('should delete a user successfully when provided with a valid user ID', async () => {
			const userId = 1;
			mockRequest.params = { id: userId.toString() };

			await userController.deleteUser(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
			expect(userController.ok).toHaveBeenCalledWith(
				mockResponse,
				`User with ID ${userId} deleted successfully`
			);
		});

		it('should return an error when attempting to delete a non-existent user', async () => {
			mockRequest.params = { id: '999' }; // Assuming 999 is a non-existent user ID
			const error = new Error('User not found');
			mockUserService.deleteUser.mockRejectedValue(error);

			await userController.deleteUser(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(mockUserService.deleteUser).toHaveBeenCalledWith(999);
			expect(nextFunction).toHaveBeenCalledWith(error);
		});
	});

	describe('updateUser', () => {
		it('should update user details successfully with valid input data', async () => {
			const userId = 1;
			mockRequest.params = { id: userId.toString() };
			mockRequest.body = {
				name: 'Updated Name',
				email: 'updated@example.com',
				role: Role.ADMIN,
			};

			await userController.updateUser(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction
			);

			expect(mockUserService.updateUser).toHaveBeenCalledWith(userId, {
				name: 'Updated Name',
				email: 'updated@example.com',
				role: Role.ADMIN,
			});
			expect(userController.ok).toHaveBeenCalledWith(
				mockResponse,
				`User with ID ${userId} updated successfully`
			);
		});
	});
});
