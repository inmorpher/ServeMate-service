import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Container } from 'inversify';
import {
	CreateUser,
	Role,
	UpdateUserDto,
	UserCredentials,
	UserSearchCriteria,
} from '../../dto/user.dto';
import { HTTPError } from '../../errors/http-error.class';
import { TYPES } from '../../types';
import { UserService } from './user.service';

jest.mock('@prisma/client', () => {
	return {
		PrismaClient: jest.fn().mockImplementation(() => ({
			user: {
				findUnique: jest.fn(),
				findMany: jest.fn(),
				create: jest.fn(),
				delete: jest.fn(),
				update: jest.fn(),
			},
		})),
	};
});

// ... остальной код остается без изменений

describe('UserService', () => {
	let userService: UserService;
	let mockPrismaClient: jest.Mocked<PrismaClient>;
	let container: Container;

	beforeEach(() => {
		container = new Container();
		mockPrismaClient = new PrismaClient() as jest.Mocked<PrismaClient>;

		container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(mockPrismaClient);
		container.bind<UserService>(UserService).toSelf();

		userService = container.get<UserService>(UserService);
	});

	describe('validateUser', () => {
		it('should validate user credentials and return user data for valid input', async () => {
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				password: 'hashedPassword123',
				role: Role.USER,
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
			jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

			const userCredentials: UserCredentials = {
				email: 'john@example.com',
				password: 'password123',
			};

			const result = await userService.validateUser(userCredentials);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: 'john@example.com' },
				select: { id: true, password: true, email: true, name: true, role: true },
			});
			expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
			expect(result).toEqual({
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				role: Role.USER,
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
				where: { email: 'nonexistent@example.com' },
				select: { id: true, password: true, email: true, name: true, role: true },
			});
		});

		it('should throw HTTPError with 401 status when password is invalid during validation', async () => {
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				password: 'hashedPassword123',
				role: Role.USER,
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
			jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

			const userCredentials: UserCredentials = {
				email: 'john@example.com',
				password: 'wrongPassword',
			};

			await expect(userService.validateUser(userCredentials)).rejects.toThrow(
				new HTTPError(401, 'UserService', 'Invalid password')
			);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: 'john@example.com' },
				select: { id: true, password: true, email: true, name: true, role: true },
			});
			expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword123');
		});
	});

	describe('findAllUsers', () => {
		it('should return all users when findAllUsers is called', async () => {
			const mockUsers = [
				{
					id: 1,
					name: 'John Doe',
					email: 'john@example.com',
					role: 'USER',
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastLogin: null,
				},
				{
					id: 2,
					name: 'Jane Smith',
					email: 'jane@example.com',
					role: 'ADMIN',
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastLogin: new Date(),
				},
			];

			(mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

			const result = await userService.findAllUsers();

			expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
				select: {
					id: true,
					email: true,
					name: true,
					role: true,
					isActive: true,
					createdAt: true,
					updatedAt: true,
					lastLogin: true,
				},
			});

			expect(result).toEqual(
				mockUsers.map((user) => ({ ...user, role: Role[user.role as keyof typeof Role] }))
			);
		});
	});

	describe('findUser', () => {
		it('should throw HTTPError with 400 status when no search criteria is provided in findUser', async () => {
			const emptyCriteria: UserSearchCriteria = {};

			await expect(userService.findUser(emptyCriteria)).rejects.toThrow(
				new HTTPError(400, 'UserService', 'At least one search criteria must be provided')
			);

			expect(mockPrismaClient.user.findMany).not.toHaveBeenCalled();
		});

		it('should throw HTTPError with 404 status when no users are found matching the criteria in findUser', async () => {
			const criteria: UserSearchCriteria = { email: 'nonexistent@example.com' };
			(mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([]);

			await expect(userService.findUser(criteria)).rejects.toThrow(HTTPError);
			await expect(userService.findUser(criteria)).rejects.toThrow(
				'No users found matching the provided criteria'
			);
			await expect(userService.findUser(criteria)).rejects.toMatchObject({
				statusCode: 404,
				context: 'UserService',
			});

			expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
				where: {
					email: {
						contains: 'nonexistent@example.com',
						mode: 'insensitive',
					},
				},
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
		});
	});

	describe('createUser', () => {
		it('should create a new user successfully and return created user data', async () => {
			const newUser: CreateUser = {
				name: 'John Doe',
				email: 'john@example.com',
				password: 'password123',
				role: Role.USER,
			};

			const hashedPassword = 'hashedPassword123';

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);
			(mockPrismaClient.user.create as jest.Mock).mockResolvedValue({
				name: newUser.name,
				email: newUser.email,
			});

			jest.spyOn(require('../../utils/password'), 'hashPassword').mockResolvedValue(hashedPassword);

			const result = await userService.createUser(newUser);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: newUser.email },
			});
			expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
				data: {
					name: newUser.name,
					email: newUser.email,
					role: newUser.role,
					password: hashedPassword,
				},
			});
			expect(result).toEqual({
				name: newUser.name,
				email: newUser.email,
			});
		});

		it('should throw HTTPError with 400 status when trying to create a user with an existing email', async () => {
			const existingUser = {
				id: 1,
				name: 'Existing User',
				email: 'existing@example.com',
				password: 'hashedPassword',
				role: Role.USER,
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

			const newUser: CreateUser = {
				name: 'New User',
				email: 'existing@example.com',
				password: 'password123',
				role: Role.USER,
			};

			await expect(userService.createUser(newUser)).rejects.toThrow(
				new HTTPError(400, 'UserService', `User with this email ${newUser.email} already exists`)
			);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: newUser.email },
			});
			expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
		});
	});

	describe('deleteUser', () => {
		it('should delete a user successfully when valid ID is provided', async () => {
			const userId = 1;
			const mockExistingUser = { id: userId, name: 'John Doe', email: 'john@example.com' };

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
			(mockPrismaClient.user.delete as jest.Mock).mockResolvedValue(undefined);

			await userService.deleteUser(userId);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: userId },
			});
			expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
				where: { id: userId },
			});
		});

		it('should throw HTTPError with 404 status when trying to delete a non-existent user', async () => {
			const nonExistentUserId = 999;
			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(userService.deleteUser(nonExistentUserId)).rejects.toThrow(HTTPError);
			await expect(userService.deleteUser(nonExistentUserId)).rejects.toThrow(
				'User with ID 999 not found'
			);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: nonExistentUserId },
			});
			expect(mockPrismaClient.user.delete).not.toHaveBeenCalled();
		});
	});

	describe('updateUser', () => {
		it('should update user information successfully when valid ID and update data are provided', async () => {
			const userId = 1;
			const updateData: UpdateUserDto = {
				name: 'Updated Name',
				email: 'updated@example.com',
				role: Role.MANAGER,
				isActive: false,
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue({
				id: userId,
				name: 'Original Name',
				email: 'original@example.com',
				role: Role.USER,
				isActive: true,
			});

			(mockPrismaClient.user.update as jest.Mock).mockResolvedValue({
				id: userId,
				...updateData,
			});

			await userService.updateUser(userId, updateData);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: userId },
			});

			expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
				where: { id: userId },
				data: updateData,
			});
		});

		it('should throw HTTPError with 404 status when trying to update a non-existent user', async () => {
			const nonExistentUserId = 999;
			const updateData: UpdateUserDto = {
				name: 'Updated Name',
				email: 'updated@example.com',
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(userService.updateUser(nonExistentUserId, updateData)).rejects.toThrow(
				new HTTPError(404, 'UserService', `User with ID ${nonExistentUserId} not found`)
			);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: nonExistentUserId },
			});
			expect(mockPrismaClient.user.update).not.toHaveBeenCalled();
		});
	});
});
