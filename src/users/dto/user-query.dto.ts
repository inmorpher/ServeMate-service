import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { UserListItem } from './user-base.dto';

/**
 * Available columns for sorting user lists.
 */
export const UserSortColumn = {
  ID: 'id',
  NAME: 'name',
  EMAIL: 'email',
  ROLE: 'role',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const;

export type UserSortColumn =
  (typeof UserSortColumn)[keyof typeof UserSortColumn];

/**
 * Schema for user query parameters.
 * Used for searching, filtering, and sorting users.
 */
export const UserQuerySchema = z.object({
  id: z.coerce.number().int().min(1).optional(),
  email: z.email().optional(),
  name: z.string().min(3).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).default(10),
  sortBy: z.enum(UserSortColumn).default(UserSortColumn.NAME),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  role: z.preprocess(
    value => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(UserRole).optional()
  ),
  isActive: z.preprocess(val => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  createdAfter: z
    .string()
    .refine(value => !value || !isNaN(Date.parse(value)), {
      message: 'createdAfter must be a valid date string',
    })
    .transform(val => (val ? new Date(val) : undefined))
    .optional(),
  createdBefore: z
    .string()
    .refine(value => !value || !isNaN(Date.parse(value)), {
      message: 'createdBefore must be a valid date string',
    })
    .transform(val => (val ? new Date(val) : undefined))
    .optional(),
});

export const UserParamsSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export type UserParamsDto = z.infer<typeof UserParamsSchema>;

/**
 * Input DTO for user search/query parameters.
 */
export type UserQueryDto = z.infer<typeof UserQuerySchema>;

/**
 * Filters that can be applied when querying users.
 */
export const UserFiltersSchema = UserQuerySchema.omit({
  page: true,
  pageSize: true,
  sortBy: true,
  sortOrder: true,
});

export type UserFilters = z.infer<typeof UserFiltersSchema>;

/**
 * Result of a paginated user list query.
 */
export type UserListResponse = {
  users: UserListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
