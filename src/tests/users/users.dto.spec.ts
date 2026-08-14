import { UserRole } from '@prisma/client';
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserParamsSchema,
  UserQuerySchema,
} from '../../users/dto';

describe('Users DTO schemas', () => {
  it('applies query defaults and normalizes role and isActive', () => {
    expect(
      UserQuerySchema.parse({
        role: 'admin',
        isActive: 'false',
      })
    ).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
        role: UserRole.ADMIN,
        isActive: false,
      })
    );
  });

  it('parses date filters and rejects invalid values', () => {
    const parsed = UserQuerySchema.parse({
      createdAfter: '2026-01-01T00:00:00.000Z',
    });

    expect(parsed.createdAfter).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(() =>
      UserQuerySchema.parse({ createdBefore: 'tomorrow' })
    ).toThrow();
  });

  it('validates create and update payloads', () => {
    expect(() =>
      CreateUserSchema.parse({
        name: 'Alice',
        email: 'alice@example.com',
        role: UserRole.ADMIN,
        password: 'short',
      })
    ).toThrow();

    expect(() => UpdateUserSchema.parse({})).toThrow();
    expect(UpdateUserSchema.parse({ isActive: false })).toEqual({
      isActive: false,
    });
  });

  it('coerces a positive numeric user id', () => {
    expect(UserParamsSchema.parse({ id: '7' })).toEqual({ id: 7 });
    expect(() => UserParamsSchema.parse({ id: '0' })).toThrow();
  });
});
