import {
	CreatedUserData,
	CreateUser,
	UpdateUserDto,
	UserCredentials,
	UserListItem,
	UserSearchCriteria,
	ValidatedUserData,
} from '../../dto/user.dto';

export interface IUserService {
	/**
	 * Validates a user's credentials.
	 * @param credentials - The user's login credentials.
	 * @returns A promise that resolves to the validated user data.
	 */
	validateUser(credentials: UserCredentials): Promise<ValidatedUserData>;

	/**
	 * Retrieves a list of all users.
	 * @returns A promise that resolves to an array of user list items.
	 */
	findAllUsers(): Promise<UserListItem[]>;

	/**
	 * Searches for users based on specified criteria.
	 * @param criteria - The search criteria to filter users.
	 * @returns A promise that resolves to an array of matching user list items.
	 */
	findUser(criteria: UserSearchCriteria): Promise<UserListItem[]>;

	/**
	 * Creates a new user.
	 * @param user - The user data for creating a new user.
	 * @returns A promise that resolves to the created user data.
	 */
	createUser(user: CreateUser): Promise<CreatedUserData>;

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
}
