import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Container } from 'inversify';
import 'reflect-metadata';
import {
	CreateUser,
	UpdateUserDto,
	UserCredentials,
	UserSearchCriteria,
} from '../../../dto/user.dto';
import { HTTPError } from '../../../errors/http-error.class';
import { UserService } from '../../../services/users/user.service';
import { IUserService } from '../../../services/users/user.service.interface';
import { TYPES } from '../../../types';

describe('UserService', () => {
	let container: Container;
	let userService: IUserService;
	let mockPrismaClient: jest.Mocked<PrismaClient>;

	beforeEach(() => {
		container = new Container();
		mockPrismaClient = {
			user: {
				findUnique: jest.fn(),
				findMany: jest.fn(),
				count: jest.fn(),
				create: jest.fn(),
				delete: jest.fn(),
				update: jest.fn(),
			},
		} as unknown as jest.Mocked<PrismaClient>;

		container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(mockPrismaClient);
		container.bind<IUserService>(TYPES.UserService).to(UserService);

		userService = container.get<IUserService>(TYPES.UserService);
	});

	describe('validateUser', () => {
		it('should validate user credentials and return correct user data for valid input', async () => {
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				password: 'hashedPassword123',
				role: 'USER',
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

			jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

			const userCredentials: UserCredentials = {
				email: 'john@example.com',
				password: 'password123',
			};

			const result = await userService.validateUser(userCredentials);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: userCredentials.email },
				select: { id: true, password: true, email: true, name: true, role: true },
			});

			expect(bcrypt.compare).toHaveBeenCalledWith(userCredentials.password, mockUser.password);

			expect(result).toEqual({
				id: mockUser.id,
				name: mockUser.name,
				email: mockUser.email,
				role: UserRole.USER,
			});
		});

		it('should throw HTTPError with 404 status when user is not found during validation', async () => {
			const userCredentials: UserCredentials = {
				email: 'nonexistent@example.com',
				password: 'password123',
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(userService.validateUser(userCredentials)).rejects.toThrow(
				new HTTPError(404, 'UserService', 'User not found')
			);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: userCredentials.email },
				select: { id: true, password: true, email: true, name: true, role: true },
			});
		});

		it('should throw HTTPError with 401 status when password is invalid during validation', async () => {
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				password: 'hashedPassword123',
				role: 'USER',
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

			jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

			const userCredentials: UserCredentials = {
				email: 'john@example.com',
				password: 'wrongPassword',
			};

			await expect(userService.validateUser(userCredentials)).rejects.toThrow(
				new HTTPError(401, 'UserService', 'Invalid password')
			);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: userCredentials.email },
				select: { id: true, password: true, email: true, name: true, role: true },
			});

			expect(bcrypt.compare).toHaveBeenCalledWith(userCredentials.password, mockUser.password);
		});
	});

	describe('findUsers', () => {
		it('should find users based on multiple search criteria and return paginated results', async () => {
			const searchCriteria: UserSearchCriteria = {
				name: 'John',
				role: UserRole.USER,
				isActive: true,
			};

			const mockUsers = [
				{
					id: 1,
					name: 'John Doe',
					email: 'john@example.com',
					role: 'USER',
					isActive: true,
					lastLogin: new Date('2023-06-01'),
					createdAt: new Date('2023-05-01'),
					updatedAt: new Date('2023-06-01'),
				},
				{
					id: 2,
					name: 'John Smith',
					email: 'smith@example.com',
					role: 'USER',
					isActive: true,
					lastLogin: new Date('2023-06-15'),
					createdAt: new Date('2023-05-15'),
					updatedAt: new Date('2023-06-15'),
				},
			];

			(mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
			(mockPrismaClient.user.count as jest.Mock).mockResolvedValue(2);

			const result = await userService.findUsers(searchCriteria);

			const expectedWhere: any = {
				name: { contains: 'John', mode: 'insensitive' },
				role: { equals: 'USER' },
				isActive: true,
			};

			if (searchCriteria.createdAfter || searchCriteria.createdBefore) {
				expectedWhere.createdAt = {};
				if (searchCriteria.createdAfter) {
					expectedWhere.createdAt.gte = searchCriteria.createdAfter;
				}
				if (searchCriteria.createdBefore) {
					expectedWhere.createdAt.lte = searchCriteria.createdBefore;
				}
			}

			expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
				where: expectedWhere,
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
				skip: 0,
				take: 10,
				orderBy: {
					name: 'asc',
				},
			});

			expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
				where: expectedWhere,
			});

			expect(result).toEqual({
				users: mockUsers.map((user) => ({ ...user, role: UserRole.USER })),
				totalCount: 2,
				page: 1,
				pageSize: 10,
				totalPages: 1,
			});
		});

		it('should handle case-insensitive email and name searches in findUsers method', async () => {
			const mockUsers = [
				{
					id: 1,
					name: 'John Doe',
					email: 'john@example.com',
					role: 'USER',
					isActive: true,
					lastLogin: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					name: 'Jane Smith',
					email: 'jane@example.com',
					role: 'ADMIN',
					isActive: true,
					lastLogin: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			(mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
			(mockPrismaClient.user.count as jest.Mock).mockResolvedValue(mockUsers.length);

			const criteria: UserSearchCriteria = {
				email: 'JOHN@example.com',
				name: 'doe',
			};

			const result = await userService.findUsers(criteria);

			expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						email: { contains: 'JOHN@example.com', mode: 'insensitive' },
						name: { contains: 'doe', mode: 'insensitive' },
					}),
				})
			);

			expect(result.users).toHaveLength(2);
			expect(result.totalCount).toBe(2);
		});
	});

	describe('createUser', () => {
		it('should create a new user successfully when valid data is provided', async () => {
			const mockUser: CreateUser = {
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
				role: UserRole.USER,
			};

			const hashedPassword = 'hashedPassword123' as never;
			jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);
			(mockPrismaClient.user.create as jest.Mock).mockResolvedValue({
				name: mockUser.name,
				email: mockUser.email,
			});

			const result = await userService.createUser(mockUser);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: mockUser.email },
			});

			expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
				data: {
					name: mockUser.name,
					email: mockUser.email,
					role: mockUser.role,
					password: hashedPassword,
				},
			});

			expect(result).toEqual({
				name: mockUser.name,
				email: mockUser.email,
			});
		});

		it('should throw HTTPError with 400 status when attempting to create a user with an existing email', async () => {
			const existingUser = {
				id: 1,
				name: 'Existing User',
				email: 'existing@example.com',
				password: 'hashedPassword123',
				role: 'USER',
			};

			const newUser: CreateUser = {
				name: 'New User',
				email: 'existing@example.com',
				password: 'password123',
				role: UserRole.USER,
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
			jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword456'));

			await expect(userService.createUser(newUser)).rejects.toThrow(
				new HTTPError(
					400,
					'UserService',
					'User with this email existing@example.com already exists'
				)
			);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: newUser.email },
			});

			expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
		});
	});

	describe('deleteUser', () => {
		it('should delete a user successfully when a valid ID is provided', async () => {
			const userId = 1;

			(mockPrismaClient.user.delete as jest.Mock).mockResolvedValue(undefined);

			await expect(userService.deleteUser(userId)).resolves.not.toThrow();

			expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
				where: {
					id: userId,
				},
			});
		});
	});

	describe('updateUser', () => {
		it('should update user information correctly when valid data is provided', async () => {
			const userId = 1;
			const updateData: UpdateUserDto = {
				name: 'Updated Name',
				email: 'updated@example.com',
				role: UserRole.MANAGER,
				isActive: false,
			};

			(mockPrismaClient.user.update as jest.Mock).mockResolvedValue({
				id: userId,
				...updateData,
			});

			await userService.updateUser(userId, updateData);

			expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
				where: { id: userId },
				data: updateData,
			});
		});

		it('should throw HTTPError when user is not found during update', async () => {
			const userId = 999;
			const updateData: UpdateUserDto = { name: 'Updated Name' };

			(mockPrismaClient.user.update as jest.Mock).mockRejectedValue(new Error('User not found'));

			await expect(userService.updateUser(userId, updateData)).rejects.toThrow(
				new HTTPError(404, 'UserService', 'An unexpected error occurred')
			);

			expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
				where: { id: userId },
				data: updateData,
			});
		});
	});
});
