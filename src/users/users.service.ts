import { PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { BaseService } from '../common/base.service';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import { hashPassword } from '../utils/password';
import {
  CreatedUserResponse,
  CreateUserDto,
  UpdateUserDto,
  UserFilters,
  UserListItem,
  UserListResponse,
  UserQueryDto,
  UserSortColumn,
} from './dto';
import { UsersRepository } from './users.repository';
import { IUsersService } from './users.service.interface';

@injectable()
export class UserService extends BaseService implements IUsersService {
  protected serviceName = 'UserService';
  private prisma: PrismaClient;

  constructor(
    @inject(TYPES.PrismaClient) prisma: PrismaClient,
    @inject(TYPES.UsersRepository) private userRepository: UsersRepository
  ) {
    super();
    this.prisma = prisma;
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
  async findUsers(criteria: UserQueryDto): Promise<UserListResponse> {
    try {
      const filters: UserFilters = {
        id: criteria.id,
        email: criteria.email,
        name: criteria.name,
        role: criteria.role,
        isActive: criteria.isActive,
        createdAfter: criteria.createdAfter,
        createdBefore: criteria.createdBefore,
      };

      const validSortBy = Object.values(UserSortColumn).includes(
        criteria.sortBy
      )
        ? criteria.sortBy
        : UserSortColumn.ID;

      const { users, total } = await this.userRepository.findMany(
        filters,
        {
          page: criteria.page,
          pageSize: criteria.pageSize,
        },
        {
          sortBy: validSortBy || this.defaultSortBy,
          sortOrder: criteria.sortOrder || this.defaultSortOrder,
        }
      );

      return {
        users,
        totalCount: total,
        page: criteria.page,
        pageSize: criteria.pageSize,
        totalPages: Math.ceil(total / criteria.pageSize),
      };
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
    return this.userRepository.findById(id);
  }

  /**
   * Creates a new user in the database.
   * @param {CreateUserDto} user - The user data to create. This object should contain:
   *        - name: string - The name of the new user.
   *        - email: string - The email address of the new user.
   *        - password: string - The password for the new user (will be hashed before storage).
   *        - role: Role - The role of the new user in the system (ADMIN, USER, HOST, or MANAGER).
   * @returns {Promise<CreatedUserResponse>} A promise that resolves to an object containing:
   *          - name: string - The name of the created user.
   *          - email: string - The email address of the created user.
   * @throws {HTTPError} If a user with the same email already exists (400 Bad Request).
   */
  async createUser(user: CreateUserDto): Promise<CreatedUserResponse> {
    try {
      const existingUser = await this.userRepository.findByEmail(user.email);

      if (existingUser) {
        throw new HTTPError(
          400,
          this.serviceName,
          `User with email ${user.email} already exists`
        );
      }

      const hashedPassword = await hashPassword(user.password);

      const newUser = await this.userRepository.create({
        name: user.name,
        email: user.email,
        role: user.role,
        password: hashedPassword,
      });

      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
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
      const activeOrders =
        await this.userRepository.countActiveOrdersByServer(id);

      if (activeOrders > 0) {
        throw new HTTPError(
          400,
          this.serviceName,
          `Cannot delete user with ID ${id} because they have active orders`
        );
      }

      await this.userRepository.delete(id);
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
      await this.userRepository.update(id, user);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
