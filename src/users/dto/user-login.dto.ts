import { z } from 'zod';
import { UserEntity, UserSchema } from './user-base.dto';

/**
 * Schema for user login credentials.
 * Used for authenticating users in the system.
 */
export const UserLoginSchema = UserSchema.pick({
    email: true,
    password: true,
});

/**
 * Input DTO for user login.
 */
export type UserLoginDto = z.infer<typeof UserLoginSchema>;

/**
 * Authenticated user data returned after successful login.
 * Excludes sensitive and internal fields.
 */
export type AuthenticatedUser = Pick<
    UserEntity,
    'id' | 'name' | 'email' | 'role'
>;