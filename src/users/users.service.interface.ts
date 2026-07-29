import { BaseService } from '../common/base.service';
import {
  AuthenticatedUser,
  CreatedUserResponse,
  CreateUserDto,
  UpdateUserDto,
  UserListItem,
  UserListResponse,
  UserLoginDto,
  UserQueryDto,
} from './dto';

export interface IUsersService extends BaseService {
  /**
   * Searches for users based on specified criteria.
   * @param criteria - The search criteria to filter users.
   * @returns A promise that resolves to an array of matching user list items.
   */
  findUsers(criteria: UserQueryDto): Promise<UserListResponse>;

  /**
   * Creates a new user.
   * @param user - The user data for creating a new user.
   * @returns A promise that resolves to the created user data.
   */
  createUser(user: CreateUserDto): Promise<CreatedUserResponse>;

  /**
   * Deletes a user by their ID.
   * @param id - The ID of the user to delete.
   * @returns A promise that resolves when the user is successfully deleted.
   */
  deleteUser(id: number): Promise<void>;

  /**
   * Updates a user's information.
   * @param id - The ID of the user to update.
   * @param user - The updated user data.
   * @returns A promise that resolves when the user is successfully updated.
   */
  updateUser(id: number, user: UpdateUserDto): Promise<void>;

  /**
   * Finds a user by their ID.
   * @param id - The ID of the user to find.
   * @returns A promise that resolves to the user data or null if not found.
   */
  findUserById(id: number): Promise<UserListItem | null>;

  validateCredentials(
    credentials: UserLoginDto
  ): Promise<AuthenticatedUser | null>;
}
