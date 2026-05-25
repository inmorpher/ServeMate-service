import '../helpers/mock-dto-package';
import '../helpers/mock-inversify';

import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import { UserRole } from '../../dto-package';
import { UserService } from '../../services/users/user.service';
import { hashPassword } from '../../utils/password';

jest.mock('bcrypt', () => ({
	compare: jest.fn(),
}));

jest.mock('../../utils/password', () => ({
	hashPassword: jest.fn(),
}));

const compareMock = compare as jest.MockedFunction<typeof compare>;
const hashPasswordMock = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe('UserService', () => {
	const createPrismaMock = () =>
		({
			user: {
				findUnique: jest.fn(),
				findMany: jest.fn(),
				count: jest.fn(),
				create: jest.fn(),
				delete: jest.fn(),
				update: jest.fn(),
			},
		} as unknown as PrismaClient);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('validates a user and reuses the cached result on subsequent calls', async () => {
		const prisma = createPrismaMock();
		const service = new UserService(prisma);
		const storedUser = {
			id: 1,
			password: 'hashed-password',
			email: 'test@example.com',
			name: 'Test User',
			role: 'ADMIN',
		};

		(prisma.user.findUnique as jest.Mock).mockResolvedValue(storedUser);
		compareMock.mockResolvedValue(true as never);

		const credentials = { email: 'test@example.com', password: 'secret' };
		const firstResult = await service.validateUser(credentials);
		const secondResult = await service.validateUser(credentials);

		expect(firstResult).toEqual({
			id: 1,
			name: 'Test User',
			email: 'test@example.com',
			role: UserRole.ADMIN,
		});
		expect(secondResult).toEqual(firstResult);
		expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
		expect(compareMock).toHaveBeenCalledTimes(1);
	});

	it('throws a 404 when a user does not exist', async () => {
		const prisma = createPrismaMock();
		const service = new UserService(prisma);
		(prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

		await expect(service.validateUser({ email: 'missing@example.com', password: 'secret' })).rejects.toMatchObject({
			statusCode: 404,
			message: 'User not found',
		});
	});

	it('throws a 401 when the password is invalid', async () => {
		const prisma = createPrismaMock();
		const service = new UserService(prisma);
		(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 1,
			password: 'hashed-password',
			email: 'test@example.com',
			name: 'Test User',
			role: 'ADMIN',
		});
		compareMock.mockResolvedValue(false as never);

		await expect(service.validateUser({ email: 'test@example.com', password: 'wrong' })).rejects.toMatchObject({
			statusCode: 401,
			message: 'Invalid password',
		});
	});

	it('creates a user after hashing the password', async () => {
		const prisma = createPrismaMock();
		const service = new UserService(prisma);
		(prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
		(prisma.user.create as jest.Mock).mockResolvedValue({
			name: 'Ada Lovelace',
			email: 'ada@example.com',
		});
		hashPasswordMock.mockResolvedValue('hashed-secret');

		const result = await service.createUser({
			name: 'Ada Lovelace',
			email: 'ada@example.com',
			role: UserRole.MANAGER,
			password: 'secret',
		});

		expect(hashPasswordMock).toHaveBeenCalledWith('secret');
		expect(prisma.user.create).toHaveBeenCalledWith({
			data: {
				name: 'Ada Lovelace',
				email: 'ada@example.com',
				role: UserRole.MANAGER,
				password: 'hashed-secret',
			},
		});
		expect(result).toEqual({
			name: 'Ada Lovelace',
			email: 'ada@example.com',
		});
	});

	it('rejects duplicate emails during user creation', async () => {
		const prisma = createPrismaMock();
		const service = new UserService(prisma);
		(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
		hashPasswordMock.mockResolvedValue('hashed-secret');

		await expect(
			service.createUser({
				name: 'Ada Lovelace',
				email: 'ada@example.com',
				role: UserRole.MANAGER,
				password: 'secret',
			})
		).rejects.toMatchObject({
			statusCode: 400,
			message: 'User with this email ada@example.com already exists',
		});
	});

	it('builds the user list query and returns a paginated result', async () => {
		const prisma = createPrismaMock();
		const service = new UserService(prisma);
		const createdAfter = new Date('2024-01-01T00:00:00.000Z');
		const createdBefore = new Date('2024-12-31T00:00:00.000Z');
		const users = [
			{
				id: 1,
				name: 'Jane',
				email: 'jane@example.com',
				role: 'ADMIN',
				isActive: true,
				lastLogin: null,
				createdAt: new Date('2024-02-01T00:00:00.000Z'),
				updatedAt: new Date('2024-02-02T00:00:00.000Z'),
			},
		];
		(prisma.user.findMany as jest.Mock).mockResolvedValue(users);
		(prisma.user.count as jest.Mock).mockResolvedValue(1);

		const result = await service.findUsers(
			{
				id: 7,
				email: 'jane',
				name: 'Jan',
				role: UserRole.ADMIN,
				isActive: true,
				createdAfter,
				createdBefore,
				page: 2,
				pageSize: 5,
				sortBy: 'name',
				sortOrder: 'desc',
			} as any,
			2,
			5,
			'name',
			'desc'
		);

		expect(prisma.user.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					id: 7,
					email: { contains: 'jane', mode: 'insensitive' },
					name: { contains: 'Jan', mode: 'insensitive' },
					role: { equals: UserRole.ADMIN },
					isActive: true,
						createdAt: { lte: createdBefore },
				}),
				skip: 5,
				take: 5,
				orderBy: { name: 'desc' },
			})
		);
		expect(result).toEqual({
			users: [
				{
					...users[0],
					role: UserRole.ADMIN,
				},
			],
			totalCount: 1,
			page: 2,
			pageSize: 5,
			totalPages: 1,
		});
	});

	it('maps unexpected prisma failures to an HTTPError', async () => {
		const prisma = createPrismaMock();
		const service = new UserService(prisma);
		(prisma.user.delete as jest.Mock).mockRejectedValue(new Error('boom'));

		await expect(service.deleteUser(1)).rejects.toMatchObject({
			statusCode: 500,
			context: 'UserService',
			message: 'An unexpected error occurred',
			path: 'boom',
		});
	});

	it('updates and deletes users through prisma', async () => {
		const prisma = createPrismaMock();
		const service = new UserService(prisma);

		await service.updateUser(5, { isActive: false } as any);
		await service.deleteUser(5);

		expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { isActive: false } });
		expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 5 } });
	});

	it('finds a user by id using a narrow select', async () => {
		const prisma = createPrismaMock();
		const service = new UserService(prisma);
		(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 12, name: 'Lee' });

		const result = await service.findUserById(12);

		expect(prisma.user.findUnique).toHaveBeenCalledWith({
			where: { id: 12 },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				isActive: true,
				lastLogin: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		expect(result).toEqual({ id: 12, name: 'Lee' });
	});
});