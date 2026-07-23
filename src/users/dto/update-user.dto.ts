import { z } from 'zod';
import { UserSchema } from './user-base.dto';

/**
 * Schema for updating user information.
 * All fields are optional, but at least one must be provided.
 */
export const UpdateUserSchema = z
    .object({
        name: z.string().min(1, { message: 'Name must not be empty' }).optional(),
        email: z.email({ message: 'Invalid email address' }).optional(),
        role: UserSchema.shape.role.optional(),
        isActive: z.boolean().optional(),
        lastLogin: z.date().optional().nullable(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: 'At least one field must be provided in the body',
        path: ['name', 'email', 'role', 'isActive', 'lastLogin'],
    });

/**
 * Input DTO for updating an existing user.
 */
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;