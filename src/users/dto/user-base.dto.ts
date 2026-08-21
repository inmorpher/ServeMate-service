import { UserRole } from '@prisma/client';
import z from 'zod';

/**
 * User roles available in the system.
 * Re-exported from Prisma for domain-level usage.
 */
export { UserRole };

/**
 * Base domain schema for a User.
 * Contains all fields that describe a user in the system,
 * including sensitive data like password.
 */
export const UserSchema = z.object({
  id: z.number().int().min(1, { message: 'ID must not be empty' }),
  name: z.string().min(1, { message: 'Name must not be empty' }),
  email: z.email({ message: 'Invalid email address' }),
  role: z.enum(UserRole, { message: 'Invalid role' }),
  isActive: z.boolean().default(true),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' }),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  lastLogin: z.date().optional().nullable(),
});
/**
 * Domain entity type for a User.
 * Represents the complete user model as stored in the system.
 */
export type UserEntity = z.infer<typeof UserSchema>;

/**
 * Public user schema for API responses.
 * Passwords must never cross the API boundary.
 */
export const UserResponseSchema = UserSchema.omit({ password: true });

/**
 * Public user response type.
 * Excludes sensitive fields like password.
 */
export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * Single item in a user list response.
 * Alias for clarity in list contexts.
 */
export type UserListItem = UserResponse;
