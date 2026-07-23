import { z } from 'zod';
import { UserEntity, UserSchema } from './user-base.dto';

/**
 * Schema for creating a new user.
 * Picks only the fields required for user creation.
 */
export const CreateUserSchema = UserSchema.pick({
    name: true,
    email: true,
    role: true,
    password: true,
});

/**
 * Input DTO for creating a new user.
 */
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

/**
 * Response DTO returned after successful user creation.
 * Contains non-sensitive public information.
 */
export type CreatedUserResponse = Pick<
  UserEntity,
  'id' | 'name' | 'email' | 'role'
>;