import { z } from 'zod';

/**
 * Enum representing the possible roles a user can have in the system.
 * These roles determine the user's permissions and access levels.
 * @enum {string}
 */
export enum Role {
	/** Administrator with full system access */
	ADMIN = 'ADMIN',
	/** Standard user with basic privileges */
	USER = 'USER',
	/** User with hosting capabilities, typically for managing events or locations */
	HOST = 'HOST',
	/** User with management responsibilities, having elevated permissions compared to standard users */
	MANAGER = 'MANAGER',
}

/**
 * Schema for a complete user object.
 * This schema defines all the fields that a user can have in the system.
 * It uses Zod for runtime type checking and validation.
 */
export const UserSchema = z.object({
	id: z.number().min(1, { message: 'ID must not be empty' }),
	name: z.string().min(1, { message: 'Name must not be empty' }),
	email: z.string().email({ message: 'Invalid email address' }),
	role: z.nativeEnum(Role, { message: 'Invalid role' }),
	isActive: z.boolean().default(true),
	password: z.string(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
	lastLogin: z.date().optional().nullable(),
});

/**
 * Type definition for a complete user object.
 * This type is inferred from the UserSchema, ensuring type safety when working with user data.
 * @typedef {Object} UserDto
 * @property {number} id - The unique identifier for the user
 * @property {string} name - The user's full name
 * @property {string} email - The user's email address
 * @property {Role} role - The user's role in the system
 * @property {boolean} isActive - Whether the user account is active
 * @property {string} password - The user's hashed password
 * @property {Date} createdAt - The timestamp when the user account was created
 * @property {Date} updatedAt - The timestamp when the user account was last updated
 * @property {Date | null} [lastLogin] - The timestamp of the user's last login (optional)
 */
export type UserDto = z.infer<typeof UserSchema>;

/**
 * Schema for creating a new user.
 * This schema picks specific fields from the UserSchema to ensure only necessary data is provided when creating a user.
 *
 * @remarks
 * The schema includes the following fields:
 * - name: The user's name
 * - email: The user's email address
 * - role: The user's role in the system
 * - password: The user's password
 *
 * @returns A Zod schema object that can be used to validate data for creating a new user
 */
export const CreateUserSchema = UserSchema.pick({
	name: true,
	email: true,
	role: true,
	password: true,
});

/**
 * Type definition for the data required to create a new user.
 * This type is inferred from the CreateUserSchema, ensuring type safety when creating users.
 *
 * @property {string} name - The user's name (non-empty string)
 * @property {string} email - The user's email address (valid email format)
 * @property {Role} role - The user's role in the system. Must be one of the following:
 *   - ADMIN: Administrator with full system access
 *   - USER: Standard user with basic privileges
 *   - HOST: User with hosting capabilities
 *   - MANAGER: User with management responsibilities
 * @property {string} password - The user's password (will be hashed before storage)
 *
 * @see {@link Role} for the complete list of available roles
 * @see {@link UserSchema} for the full user schema including additional fields
 */
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

/**
 * Schema for a single ID parameter.
 * Used when an API endpoint requires only an ID as input.
 *
 * @property {string} id - The unique identifier (non-empty string).
 */
export const IdParamSchema = z.object({
	id: z.string().min(1, { message: 'ID must not be empty' }),
});

/**
 * Type definition for an ID parameter.
 * This type is inferred from the IdParamSchema.
 *
 * @property {string} id - The unique identifier (non-empty string)
 */
export type IdParamDto = z.infer<typeof IdParamSchema>;

/**
 * Schema for user query parameters.
 * Used when searching or filtering users.
 * At least one of these parameters must be provided.
 *
 * @property {number} [id] - The user's ID (optional).
 * @property {string} [email] - The user's email address (optional).
 * @property {string} [name] - The user's name (optional, minimum 3 characters).
 */
export const UserParamSchema = z
	.object({
		id: z
			.string()
			.optional()
			.transform((value) => (value ? parseInt(value) : undefined)),
		email: z.string().email().optional(),
		name: z.string().min(3).optional(),
	})
	.refine((data) => data.id || data.email || data.name, {
		message: 'At least one of id, email, or name must be provided in the path',
	});

/**
 * Type definition for user query parameters.
 * This type is inferred from the UserParamSchema.
 *
 * @property {number} [id] - The user's ID (optional)
 * @property {string} [email] - The user's email address (optional)
 * @property {string} [name] - The user's name (optional, minimum 3 characters)
 */
export type UserQueryParamDto = z.infer<typeof UserParamSchema>;

/**
 * Schema for updating user information.
 * All fields are optional, but at least one must be provided.
 *
 * @property {string} [name] - The user's new name (optional, minimum 1 character).
 * @property {string} [email] - The user's new email address (optional).
 * @property {Role} [role] - The user's new role (optional).
 * @property {boolean} [isActive] - The user's new active status (optional).
 */
export const UpdateUserSchema = UserSchema.pick({
	name: true,
	email: true,
	role: true,
	isActive: true,
	lastLogin: true,
})
	.partial()
	.refine((data) => Object.values(data).some((value) => value !== undefined), {
		message: 'At least one field must be provided in the body',
		path: ['name', 'email', 'role', 'isActive', 'lastLogin'],
	});

/**
 * Type definition for updating user information.
 * This type is inferred from the UpdateUserSchema.
 *
 * @property {string} [name] - The user's new name (optional, minimum 1 character)
 * @property {string} [email] - The user's new email address (optional)
 * @property {Role} [role] - The user's new role (optional)
 * @property {boolean} [isActive] - The user's new active status (optional)
 *
 * @see {@link Role} for the available user roles
 */
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

/**
 * Schema for user login credentials.
 * Used for authenticating users in the system.
 *
 * @property {string} email - The user's email address.
 * @property {string} password - The user's password.
 */
export const UserLoginSchema = UserSchema.pick({
	email: true,
	password: true,
});

/**
 * Type definition for user validation credentials.
 * This type is inferred from the UserLoginSchema and used for authenticating users.
 *
 * @property {string} email - The user's email address
 * @property {string} password - The user's password
 */
export type UserCredentials = z.infer<typeof UserLoginSchema>;

/**
 * Type definition for validated user data.
 * This type represents the user data after successful authentication, excluding sensitive information.
 *
 * @property {number} id - The unique identifier for the user
 * @property {string} name - The user's full name
 * @property {string} email - The user's email address
 * @property {Role} role - The user's role in the system
 */
export type ValidatedUserData = Omit<
	UserDto,
	'password' | 'isActive' | 'createdAt' | 'updatedAt' | 'lastLogin'
>;

/**
 * Type definition for a user list item.
 * This type represents a user in a list view, excluding the password for security reasons.
 *
 * @property {number} id - The unique identifier for the user
 * @property {string} name - The user's full name
 * @property {string} email - The user's email address
 * @property {Role} role - The user's role in the system
 * @property {boolean} isActive - Whether the user account is active
 * @property {Date} createdAt - The timestamp when the user account was created
 * @property {Date} updatedAt - The timestamp when the user account was last updated
 * @property {Date | null} [lastLogin] - The timestamp of the user's last login (optional)
 */
export type UserListItem = Omit<UserDto, 'password'>;

/**
 * Type definition for user search criteria.
 * This type is inferred from the UserParamSchema and used for searching or filtering users.
 *
 * @property {number} [id] - The user's ID (optional)
 * @property {string} [email] - The user's email address (optional)
 * @property {string} [name] - The user's name (optional, minimum 3 characters)
 */
export type UserSearchCriteria = z.infer<typeof UserParamSchema>;

/**
 * Type definition for creating a new user.
 * This type is inferred from the CreateUserSchema and contains all necessary fields for user creation.
 *
 * @property {string} name - The user's full name
 * @property {string} email - The user's email address
 * @property {Role} role - The user's role in the system
 * @property {string} password - The user's password (will be hashed before storage)
 */
export type CreateUser = z.infer<typeof CreateUserSchema>;

/**
 * Type definition for data returned after creating a new user.
 * This type contains only non-sensitive information about the newly created user.
 *
 * @property {string} name - The user's full name
 * @property {string} email - The user's email address
 */
export type CreatedUserData = Pick<UserDto, 'name' | 'email'>;
