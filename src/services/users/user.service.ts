import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../../common/base.service';
import {
	CreatedUserData,
	CreateUser,
	Role,
	UpdateUserDto,
	UserCredentials,
	UserListItem,
	UserSearchCriteria,
	ValidatedUserData,
} from '../../dto/user.dto';
import { HTTPError } from '../../errors/http-error.class';
import { TYPES } from '../../types';
import { hashPassword } from '../../utils/password';
import { IUserService } from './user.service.interface';

@injectable()
export class UserService extends BaseService implements IUserService {
	private prisma: PrismaClient;
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

		const userRole: Role = Role[existingUser.role as keyof typeof Role];

		return {
			id: existingUser.id,
			name: existingUser.name,
			email: existingUser.email,
			role: userRole,
		};
	}

	/**
	 * Retrieves all users from the database.
	 * @returns {Promise<UserListItem[]>} A promise that resolves to an array of UserListItem objects.
	 *          Each UserListItem contains the following properties:
	 *          - id: number - The unique identifier of the user.
	 *          - name: string - The name of the user.
	 *          - email: string - The email address of the user.
	 *          - role: Role - The role of the user in the system (ADMIN, USER, HOST, or MANAGER).
	 *          - isActive: boolean - Indicates whether the user account is active.
	 *          - createdAt: Date - The date and time when the user account was created.
	 *          - updatedAt: Date - The date and time when the user account was last updated.
	 *          - lastLogin: Date | null - The date and time of the user's last login, or null if never logged in.
	 *
	 */
	async findAllUsers(): Promise<UserListItem[]> {
		try {
			const users = await this.prisma.user.findMany({
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

			return users.map((user) => ({ ...user, role: user.role as unknown as Role }));
		} catch (error) {
			this.handleServiceError(error);
			return [];
		}
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
	async findUser(criteria: UserSearchCriteria): Promise<UserListItem[]> {
		try {
			const { id, email, name } = criteria;

			if (!id && !email && !name) {
				throw new HTTPError(400, 'UserService', 'At least one search criteria must be provided');
			}

			const where = {
				...(id !== undefined && { id: Number(id) }),
				...(email && { email: { contains: email, mode: 'insensitive' as const } }),
				...(name && { name: { contains: name, mode: 'insensitive' as const } }),
			};

			const users = await this.prisma.user.findMany({
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
			});

			if (users.length === 0) {
				throw new HTTPError(404, 'UserService', 'No users found matching the provided criteria');
			}

			return users.map((user) => ({ ...user, role: user.role as Role }));
		} catch (error) {
			throw this.handleServiceError(error);
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
			throw this.handleServiceError(error);
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
			throw this.handleServiceError(error);
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
			throw this.handleServiceError(error);
		}
	}

	/**
	 * Handles errors that occur during database operations.
	 * This method specifically handles Prisma-related errors and converts them into appropriate HTTPError instances.
	 *
	 * @param error - The error object to be handled. This can be any type of error thrown during database operations.
	 * @returns An HTTPError instance with an appropriate status code and message based on the Prisma error code,
	 *          or a generic Error if the input is not a PrismaClientKnownRequestError.
	 */
	private handleServiceError(error: unknown): HTTPError | Error {
		return super.handleError(error, 'UserService');
	}
}
