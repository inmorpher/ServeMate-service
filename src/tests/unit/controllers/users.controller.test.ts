import { NextFunction, Request, Response } from 'express';
import { Container } from 'inversify';
import { TypedRequest } from '../../../common/route.interface';
import { UserController } from '../../../controllers/users/users.controller';
import {
	CreateUser,
	UpdateUserDto,
	UserListResult,
	UserSearchCriteria,
} from '../../../dto/user.dto';
import { ILogger } from '../../../services/logger/logger.service.interface';
import { UserService } from '../../../services/users/user.service';
import { TYPES } from '../../../types';

jest.mock('../../../services/users/user.service');
jest.mock('../../../services/logger/logger.service.interface');

describe('UserController', () => {
	let userController: UserController;
	let userService: jest.Mocked<UserService>;
	let loggerService: jest.Mocked<ILogger>;
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: NextFunction;
	let okSpy: jest.SpyInstance;

	beforeEach(() => {
		const container = new Container();
		container.bind<ILogger>(TYPES.ILogger).toConstantValue(loggerService);
		container.bind<UserService>(TYPES.UserService).toConstantValue(userService);
		userService = {
			findUsers: jest.fn(),
			createUser: jest.fn(),
			deleteUser: jest.fn(),
			updateUser: jest.fn(),
		} as any;

		loggerService = {
			log: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
		} as any;
		userController = new UserController(loggerService, userService);

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockResponse = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(),
		} as unknown as Response;

		okSpy = jest.spyOn(userController, 'ok').mockImplementation(() => mockResponse);
		next = jest.fn();
	});

	describe('getUsers', () => {
		it('must successfully return list of users', async () => {
			const mockResult: UserListResult = {
				users: [],
				totalCount: 0,
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

			req = {
				query: criteria,
			} as TypedRequest<{}, UserSearchCriteria, {}>;

			userService.findUsers.mockResolvedValue(mockResult);

			await userController.getUsers(
				req as TypedRequest<{}, UserSearchCriteria, {}>,
				res as Response,
				next
			);

			expect(userService.findUsers).toHaveBeenCalledWith(
				criteria,
				criteria.page,
				criteria.pageSize,
				criteria.sortBy,
				criteria.sortOrder
			);
			expect(okSpy).toHaveBeenCalledWith(res, mockResult);
		});

		it('must handle errors', async () => {
			const criteria: UserSearchCriteria = {
				page: 1,
				pageSize: 10,
				sortBy: 'name',
				sortOrder: 'asc',
			};

			req = {
				query: criteria,
			} as TypedRequest<{}, UserSearchCriteria, {}>;

			const error = new Error('Test error');
			userService.findUsers.mockRejectedValue(error);

			await userController.getUsers(
				req as TypedRequest<{}, UserSearchCriteria, {}>,
				res as Response,
				next
			);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('createUser', () => {
		it('must create new user', async () => {
			const newUser: CreateUser = {
				name: 'John Doe',
				email: 'john@example.com',
				role: 'USER',
				password: 'password123',
			};
			userService.createUser.mockResolvedValue({
				name: newUser.name,
				email: newUser.email,
			});

			req = { body: newUser } as TypedRequest<{}, {}, CreateUser>;

			await userController.createUser(req as Request, res as Response, next);

			expect(userService.createUser).toHaveBeenCalledWith(newUser);
			expect(loggerService.log).toHaveBeenCalledWith(
				`User JOHN DOE john@example.com created successfully`
			);
			expect(okSpy).toHaveBeenCalledWith(
				res,
				`User JOHN DOE john@example.com created successfully`
			);
		});

		it('must handle errors', async () => {
			const newUser: CreateUser = {
				name: 'John Doe',
				email: 'john@example.com',
				role: 'USER',
				password: 'password123',
			};
			const error = new Error('Ошибка создания пользователя');
			userService.createUser.mockRejectedValue(error);

			req.body = newUser;

			await userController.createUser(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('deleteUser', () => {
		it('must successfully delete user', async () => {
			userService.deleteUser.mockResolvedValue();

			req = { params: { id: '1' } };

			await userController.deleteUser(
				req as TypedRequest<{ id: string | number }, unknown, unknown>,
				res as Response,
				next
			);

			expect(userService.deleteUser).toHaveBeenCalledWith(1);
			expect(okSpy).toHaveBeenCalledWith(res, `User with ID 1 deleted successfully`);
		});

		it('must handle errors', async () => {
			const error = new Error('error deleting user');
			userService.deleteUser.mockRejectedValue(error);

			req.params = { id: '1' };

			await userController.deleteUser(
				req as TypedRequest<{ id: string | number }, unknown, unknown>,
				res as Response,
				next
			);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('updateUser', () => {
		it('must update user', async () => {
			const updateData: UpdateUserDto = {
				name: 'Jane Doe',
			};
			userService.updateUser.mockResolvedValue();

			req = { params: { id: '1' } };
			req.body = updateData;

			await userController.updateUser(
				req as TypedRequest<{ id: number }, {}, UpdateUserDto>,
				res as Response,
				next
			);

			expect(userService.updateUser).toHaveBeenCalledWith(1, updateData);
			expect(okSpy).toHaveBeenCalledWith(res, `User with ID 1 updated successfully`);
		});

		it('must handle error', async () => {
			const updateData: UpdateUserDto = {
				name: 'Jane Doe',
			};
			const error = new Error('Ошибка обновления пользователя');
			userService.updateUser.mockRejectedValue(error);

			req.params = { id: '1' };
			req.body = updateData;

			await userController.updateUser(
				req as TypedRequest<{ id: number }, {}, UpdateUserDto>,
				res as Response,
				next
			);

			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
