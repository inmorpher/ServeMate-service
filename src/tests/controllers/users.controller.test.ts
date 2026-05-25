import '../helpers/mock-dto-package';
import '../helpers/mock-inversify';

jest.mock('../../decorators/Roles', () => ({
	Roles: () => () => undefined,
}));

import { UserController } from '../../controllers/users/users.controller';
import { UserRole, UserSortColumn } from '../../dto-package';
import { ILogger } from '../../services/logger/logger.service.interface';
import { UserService } from '../../services/users/user.service';
import { createMockNext, createMockRequest, createMockResponse } from '../helpers/http-test-utils';

describe('UserController', () => {
	const createLoggerMock = () =>
		({
			log: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			silly: jest.fn(),
			setContext: jest.fn(),
		} as unknown as ILogger);

	const createUserServiceMock = () =>
		({
			findUsers: jest.fn(),
			createUser: jest.fn(),
			deleteUser: jest.fn(),
			updateUser: jest.fn(),
		} as unknown as UserService);

	let logSpy: jest.SpyInstance;

	beforeEach(() => {
		logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
	});

	afterEach(() => {
		logSpy.mockRestore();
	});

	it('loads users using the validated query data', async () => {
		const logger = createLoggerMock();
		const userService = createUserServiceMock();
		const controller = new UserController(logger, userService);
		const result = {
			users: [],
			totalCount: 0,
			page: 2,
			pageSize: 25,
			totalPages: 0,
		};
		(userService.findUsers as jest.Mock).mockResolvedValue(result);
		const createdAfter = new Date('2024-01-01T00:00:00.000Z');
		const createdBefore = new Date('2024-12-31T00:00:00.000Z');
		const req = createMockRequest({
			query: {
				id: 7,
				email: 'user@example.com',
				name: 'User',
				page: '2',
				pageSize: '25',
				sortBy: UserSortColumn.CREATED_AT,
				sortOrder: 'desc',
				role: UserRole.MANAGER,
				isActive: true,
				createdAfter,
				createdBefore,
			} as any,
		});
		const res = createMockResponse();
		const next = createMockNext();

		await controller.getUsers(req as any, res, next);

		expect(userService.findUsers).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 7,
				email: 'user@example.com',
				name: 'User',
				role: UserRole.MANAGER,
				isActive: true,
				createdAfter,
				createdBefore,
				page: 2,
				pageSize: 25,
				sortBy: UserSortColumn.CREATED_AT,
				sortOrder: 'desc',
			}),
			2,
			25,
			UserSortColumn.CREATED_AT,
			'desc'
		);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(result);
	});

	it('creates users and returns the formatted success message', async () => {
		const logger = createLoggerMock();
		const userService = createUserServiceMock();
		const controller = new UserController(logger, userService);
		(userService.createUser as jest.Mock).mockResolvedValue({
			name: 'Alice',
			email: 'alice@example.com',
		});
		const req = createMockRequest({
			body: {
				name: 'Alice',
				email: 'alice@example.com',
				role: UserRole.ADMIN,
				password: 'secret',
			},
		});
		const res = createMockResponse();
		const next = createMockNext();

		await controller.createUser(req as any, res, next);

		expect(userService.createUser).toHaveBeenCalledWith({
			name: 'Alice',
			email: 'alice@example.com',
			role: UserRole.ADMIN,
			password: 'secret',
		});
		expect(logger.log).toHaveBeenCalledWith('User ALICE alice@example.com created successfully');
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith('User ALICE alice@example.com created successfully');
	});

	it('updates users by numeric id', async () => {
		const logger = createLoggerMock();
		const userService = createUserServiceMock();
		const controller = new UserController(logger, userService);
		const req = createMockRequest({
			params: { id: '5' },
			body: { isActive: false },
		});
		const res = createMockResponse();
		const next = createMockNext();

		await controller.updateUser(req as any, res, next);

		expect(userService.updateUser).toHaveBeenCalledWith(5, { isActive: false });
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith('User with ID 5 updated successfully');
	});

	it('deletes users by numeric id', async () => {
		const logger = createLoggerMock();
		const userService = createUserServiceMock();
		const controller = new UserController(logger, userService);
		const req = createMockRequest({ params: { id: '9' } });
		const res = createMockResponse();
		const next = createMockNext();

		await controller.deleteUser(req as any, res, next);

		expect(userService.deleteUser).toHaveBeenCalledWith(9);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith('User with ID 9 deleted successfully');
	});
});