import { PrismaClient } from '@prisma/client';
import {
	CreatedUserData,
	CreateUser,
	UpdateUserDto,
	UserCredentials,
	UserListItem,
	UserListResult,
	UserRole,
	UserSearchCriteria,
	ValidatedUserData,
} from '@servemate/dto';
import { compare } from 'bcrypt';
import crypto from 'crypto';
import { inject, injectable } from 'inversify';
import NodeCache from 'node-cache';
import 'reflect-metadata';
import { BaseService } from '../../common/base.service';
import { HTTPError } from '../../errors/http-error.class';
import { TYPES } from '../../types';
import { hashPassword } from '../../utils/password';
import { IUserService } from './user.service.interface';

@injectable()
export class UserService extends BaseService implements IUserService {
	protected serviceName = 'UserService';
	private prisma: PrismaClient;
	private authCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 минут

	constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
		super();
		this.prisma = prisma;
	}

	/**
	 * Validates a user's credentials and returns the user's data if valid.
	 * @param {UserCredentials} user - The user credentials to validate.
	 *        UserCredentials is an object with the following properties:
	 *        - email: string - The email address of the user.
	 *        - password: string - The password of the user (in plain text).
	 * @returns {Promise<ValidatedUserData>} A promise that resolves to the validated user data, including:
	 *          - id: number - The unique identifier of the user.
	 *          - name: string - The name of the user.
	 *          - email: string - The email address of the user.
	 *          - role: Role - The role of the user in the system (ADMIN, USER, HOST, or MANAGER).
	 * @throws {HTTPError} If the user is not found (404) or the password is invalid (401).
	 */
	async validateUser(user: UserCredentials): Promise<ValidatedUserData> {
		const { email, password } = user;

		// Генерируем ключ кэша на основе email и password
		const cacheKey = crypto.createHash('sha256').update(`${email}:${password}`).digest('hex');

		// Проверяем кэш перед обращением к базе данных
		const cachedUser = this.authCache.get<ValidatedUserData>(cacheKey);
		if (cachedUser) {
			return cachedUser;
		}

		// Существующая логика поиска пользователя
		const existingUser = await this.prisma.user.findUnique({
			where: { email },
			select: { id: true, password: true, email: true, name: true, role: true },
		});

		if (!existingUser) {
			throw new HTTPError(404, 'UserService', 'User not found');
		}

		const isPasswordValid = await compare(password, existingUser.password);

		if (!isPasswordValid) {
			throw new HTTPError(401, 'UserService', 'Invalid password');
		}

		const userRole: UserRole = UserRole[existingUser.role as keyof typeof UserRole];

		const result = {
			id: existingUser.id,
			name: existingUser.name,
			email: existingUser.email,
			role: userRole,
		};

		this.authCache.set(cacheKey, result);

		return result;
	}

	/**
	 * Searches for users based on the provided criteria.
	 * @param {UserSearchCriteria} criteria - The search criteria to use for finding users.
	 *        UserSearchCriteria is an object that may contain the following properties:
	 *        - id?: number - The unique identifier of the user (optional).
	 *        - email?: string - The email address of the user (optional, case-insensitive).
	 *        - name?: string - The name of the user (optional, case-insensitive).
	 * @returns {Promise<UserListItem[]>} A promise that resolves to an array of UserListItem objects matching the criteria.
	 *          Each UserListItem contains the following properties:
	 *          - id: number - The unique identifier of the user.
	 *          - name: string - The name of the user.
	 *          - email: string - The email address of the user.
	 *          - role: Role - The role of the user in the system (ADMIN, USER, HOST, or MANAGER).
	 *          - isActive: boolean - Indicates whether the user account is active.
	 *          - createdAt: Date - The date and time when the user account was created.
	 *          - updatedAt: Date - The date and time when the user account was last updated.
	 *          - lastLogin: Date | null - The date and time of the user's last login, or null if never logged in.
	 * @throws {HTTPError} If no search criteria is provided (400) or no users are found (404).
	 *
	 */
	async findUsers(
		criteria: UserSearchCriteria,
		page: number = 1,
		pageSize: number = 10,
		sortBy: string = 'name',
		sortOrder: 'asc' | 'desc' = 'asc'
	): Promise<UserListResult> {
		try {
			const { id, email, name, role, isActive, createdAfter, createdBefore } = criteria;

			const where = {
				...(id !== undefined && { id: Number(id) }),
				...(email && { email: { contains: email, mode: 'insensitive' as const } }),
				...(name && { name: { contains: name, mode: 'insensitive' as const } }),
				...(role && { role: { equals: role.toUpperCase() as UserRole } }),
				...(isActive !== undefined && { isActive }),
				...(createdAfter && { createdAt: { gte: createdAfter } }),
				...(createdBefore && { createdAt: { lte: createdBefore } }),
			};

			const [users, total] = await Promise.all([
				this.prisma.user.findMany({
					where,
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
					skip: (page - 1) * pageSize,
					take: pageSize,
					orderBy: {
						[sortBy]: sortOrder,
					},
				}),
				this.prisma.user.count({ where }),
				page,
			]);

			return {
				users: users.map((user) => ({ ...user, role: user.role as UserRole })),
				totalCount: total,
				page,
				pageSize,
				totalPages: Math.ceil(total / pageSize),
			};
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Creates a new user in the database.
	 * @param {CreateUser} user - The user data to create. This object should contain:
	 *        - name: string - The name of the new user.
	 *        - email: string - The email address of the new user.
	 *        - password: string - The password for the new user (will be hashed before storage).
	 *        - role: Role - The role of the new user in the system (ADMIN, USER, HOST, or MANAGER).
	 * @returns {Promise<CreatedUserData>} A promise that resolves to an object containing:
	 *          - name: string - The name of the created user.
	 *          - email: string - The email address of the created user.
	 * @throws {HTTPError} If a user with the same email already exists (400 Bad Request).
	 */
	async createUser(user: CreateUser): Promise<CreatedUserData> {
		try {
			const hashedPassword = await hashPassword(user.password);
			const existingUser = await this.prisma.user.findUnique({
				where: {
					email: user.email,
				},
			});

			if (existingUser) {
				throw new HTTPError(
					400,
					'UserService',
					`User with this email ${user.email} already exists`
				);
			}

			const newUser = await this.prisma.user.create({
				data: {
					name: user.name,
					email: user.email,
					role: user.role,
					password: hashedPassword,
				},
			});

			return {
				name: newUser.name,
				email: newUser.email,
			};
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Deletes a user from the database.
	 * @param id - The ID of the user to delete.
	 * @returns A promise that resolves when the user is successfully deleted.
	 * @throws {HTTPError} If the user with the given ID is not found.
	 */
	async deleteUser(id: number): Promise<void> {
		try {
			await this.prisma.user.delete({
				where: {
					id,
				},
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Updates a user's information in the database.
	 * @param {number} id - The unique identifier of the user to update.
	 * @param {UpdateUserDto} user - The updated user data. This object may contain any of the following properties:
	 *        - name?: string - The new name for the user (optional).
	 *        - email?: string - The new email address for the user (optional).
	 *        - role?: Role - The new role for the user (optional, must be one of ADMIN, USER, HOST, or MANAGER).
	 *        - isActive?: boolean - The new active status for the user (optional).
	 *        - password?: string - The new password for the user (optional, will be hashed before storage).
	 * @returns {Promise<void>} A promise that resolves when the user is successfully updated.
	 * @throws {HTTPError} If the user with the given ID is not found (404 Not Found).
	 * @throws {Error} If there's an issue with the database operation.
	 */
	async updateUser(id: number, user: UpdateUserDto): Promise<void> {
		try {
			await this.prisma.user.update({
				where: { id },
				data: user,
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Finds a user by their unique identifier.
	 * @param {number} id - The unique identifier of the user to find.
	 * @returns {Promise<User | null>} A promise that resolves to the user data if found, or null if not found.
	 */
	async findUserById(id: number): Promise<UserListItem | null> {
		return this.prisma.user.findUnique({
			where: { id },
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
	}
}
