import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import 'reflect-metadata';
import {
	CreateUser,
	Role,
	UpdateUserDto,
	UserCredentials,
	UserSearchCriteria,
} from '../../dto/user.dto';
import { HTTPError } from '../../errors/http-error.class';
import * as passwordUtils from '../../utils/password';
import { UserService } from './user.service';
// Extend PrismaClient type to include Jest mock methods
type MockPrismaClient = {
	[K in keyof PrismaClient]: jest.Mocked<PrismaClient[K]>;
};

describe('UserService', () => {
	let userService: UserService;
	let mockPrismaClient: MockPrismaClient;

	beforeEach(() => {
		mockPrismaClient = {
			user: {
				findUnique: jest.fn(),
				findMany: jest.fn(),
				create: jest.fn(),
				delete: jest.fn(),
				update: jest.fn(),
			},
		} as unknown as MockPrismaClient;

		userService = new UserService(mockPrismaClient as unknown as PrismaClient);
	});

	describe('validateUser', () => {
		it('should validate user credentials and return user data for valid input', async () => {
			const mockUser: Partial<User> = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				password: 'hashedPassword123',
				role: Role.USER,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				lastLogin: null,
				refreshToken: null,
				resetPasswordToken: null,
				resetPasswordExpires: null,
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser as User);
			jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

			const userCredentials: UserCredentials = {
				email: 'john@example.com',
				password: 'password123',
			};

			const result = await userService.validateUser(userCredentials);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: userCredentials.email },
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

		it('should throw HTTPError 404 when validating non-existent user', async () => {
			const nonExistentUser: UserCredentials = {
				email: 'nonexistent@example.com',
				password: 'password123',
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(userService.validateUser(nonExistentUser)).rejects.toThrow(
				new HTTPError(404, 'UserService', 'User not found')
			);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: nonExistentUser.email },
				select: { id: true, password: true, email: true, name: true, role: true },
			});
		});

		it('should throw HTTPError 401 when validating user with incorrect password', async () => {
			const mockUser: Partial<User> = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				password: 'hashedPassword123',
				role: Role.USER,
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser as User);
			jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

			const userCredentials: UserCredentials = {
				email: 'john@example.com',
				password: 'incorrectPassword',
			};

			await expect(userService.validateUser(userCredentials)).rejects.toThrow(
				new HTTPError(401, 'UserService', 'Invalid password')
			);
		});
	});

	describe('findAllUsers', () => {
		it('should retrieve all users from the database successfully', async () => {
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
		it('should find users based on partial name match (case-insensitive)', async () => {
			const mockUsers = [
				{
					id: 1,
					name: 'John Doe',
					email: 'john@example.com',
					role: 'USER',
					isActive: true,
					lastLogin: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					name: 'Jane Doe',
					email: 'jane@example.com',
					role: 'ADMIN',
					isActive: true,
					lastLogin: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			(mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

			const result = await userService.findUser({ name: 'doe' });

			expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
				where: {
					name: { contains: 'doe', mode: 'insensitive' },
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

			expect(result).toEqual(
				mockUsers.map((user) => ({ ...user, role: Role[user.role as keyof typeof Role] }))
			);
		});

		it('should throw HTTPError 400 when searching for users without any search criteria', async () => {
			const emptyCriteria: UserSearchCriteria = {};

			await expect(userService.findUser(emptyCriteria)).rejects.toThrow(
				new HTTPError(400, 'UserService', 'At least one search criteria must be provided')
			);

			expect(mockPrismaClient.user.findMany).not.toHaveBeenCalled();
		});

		it('should throw 404 when user not found in findUser method', async () => {
			const criteria: UserSearchCriteria = { email: 'nonexistent@example.com' };
			(mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([]);

			await expect(userService.findUser(criteria)).rejects.toThrow(
				new HTTPError(404, 'UserService', 'No users found matching the provided criteria')
			);

			expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
				where: {
					email: { contains: 'nonexistent@example.com', mode: 'insensitive' },
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
			jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue(hashedPassword);

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);
			(mockPrismaClient.user.create as jest.Mock).mockResolvedValue({
				name: newUser.name,
				email: newUser.email,
			});

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

		it('should throw HTTPError 400 when attempting to create user with existing email', async () => {
			const existingUser = {
				id: 1,
				name: 'Existing User',
				email: 'existing@example.com',
				password: 'hashedPassword123',
				role: Role.USER,
			};

			const newUser: CreateUser = {
				name: 'New User',
				email: 'existing@example.com',
				password: 'newPassword123',
				role: Role.USER,
			};

			(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

			await expect(userService.createUser(newUser)).rejects.toThrow(
				new HTTPError(
					400,
					'UserService',
					'User with this email existing@example.com already exists'
				)
			);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: 'existing@example.com' },
			});
			expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
		});
	});

	describe('deleteUser', () => {
		it('should throw HTTPError when attempting to delete non-existent user', async () => {
			const nonExistentUserId = 999;
			(mockPrismaClient.user.delete as jest.Mock).mockRejectedValue(new Error('User not found'));

			await expect(userService.deleteUser(nonExistentUserId)).rejects.toThrow(HTTPError);
			expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
				where: { id: nonExistentUserId },
			});
		});
	});

	describe('updateUser', () => {
		it('should update user information successfully for valid input', async () => {
			const userId = 1;
			const updateUserDto: UpdateUserDto = {
				name: 'Updated Name',
				email: 'updated@example.com',
				role: Role.ADMIN,
				isActive: true,
			};

			(mockPrismaClient.user.update as jest.Mock).mockResolvedValue({
				id: userId,
				...updateUserDto,
			});

			await userService.updateUser(userId, updateUserDto);

			expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
				where: { id: userId },
				data: updateUserDto,
			});
		});
	});
});
