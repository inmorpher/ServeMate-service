import { UserRole } from '@prisma/client';
import { HTTPError } from '../../errors/http-error.class';
import {
  CreateUserDto,
  UserListItem,
  UserQueryDto,
  UserSortColumn,
} from '../../users/dto';
import { UsersRepository } from '../../users/users.repository';
import { UserService } from '../../users/users.service';

const repositoryMock = (): jest.Mocked<UsersRepository> =>
  ({
    findMany: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    existsByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countActiveOrdersByServer: jest.fn(),
    verifyCredentials: jest.fn(),
  }) as jest.Mocked<UsersRepository>;

const user = (overrides: Partial<UserListItem> = {}): UserListItem => ({
  id: 7,
  name: 'Alice',
  email: 'alice@example.com',
  role: UserRole.ADMIN,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLogin: null,
  ...overrides,
});

describe('UserService', () => {
  let repository: jest.Mocked<UsersRepository>;
  let service: UserService;

  beforeEach(() => {
    repository = repositoryMock();
    service = new UserService({} as any, repository);
  });

  it('returns paginated users and validates the sort column', async () => {
    const criteria = {
      page: 2,
      pageSize: 2,
      sortBy: 'invalid' as UserQueryDto['sortBy'],
      sortOrder: 'desc',
    } as UserQueryDto;
    repository.findMany.mockResolvedValue({ users: [user()], total: 5 });

    await expect(service.findUsers(criteria)).resolves.toEqual({
      users: [user()],
      totalCount: 5,
      page: 2,
      pageSize: 2,
      totalPages: 3,
    });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        id: undefined,
        email: undefined,
        name: undefined,
      }),
      { page: 2, pageSize: 2 },
      { sortBy: UserSortColumn.ID, sortOrder: 'desc' }
    );
  });

  it('hashes a new user password and returns a public response', async () => {
    const data: CreateUserDto = {
      name: 'Alice',
      email: 'alice@example.com',
      role: UserRole.ADMIN,
      password: 'secret123',
    };
    repository.findByEmail.mockResolvedValue(null);
    repository.create.mockResolvedValue({
      id: 7,
      name: data.name,
      email: data.email,
      role: data.role,
    });

    await expect(service.createUser(data)).resolves.toEqual({
      id: 7,
      name: 'Alice',
      email: 'alice@example.com',
      role: UserRole.ADMIN,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: data.name,
        email: data.email,
        role: data.role,
        password: expect.stringMatching(/^\$2[aby]\$/),
      })
    );
    expect(repository.create.mock.calls[0][0].password).not.toBe(data.password);
  });

  it('rejects creating a duplicate email', async () => {
    repository.findByEmail.mockResolvedValue(user());

    await expect(
      service.createUser({
        name: 'Bob',
        email: 'alice@example.com',
        role: UserRole.USER,
        password: 'secret123',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('does not delete a user with active orders', async () => {
    repository.countActiveOrdersByServer.mockResolvedValue(2);

    await expect(service.deleteUser(7)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('deletes a user without active orders', async () => {
    repository.countActiveOrdersByServer.mockResolvedValue(0);

    await expect(service.deleteUser(7)).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(7);
  });

  it('validates credentials and omits the password', async () => {
    repository.verifyCredentials.mockResolvedValue(user());

    await expect(
      service.validateCredentials({
        email: 'alice@example.com',
        password: 'secret123',
      })
    ).resolves.toEqual({
      id: 7,
      name: 'Alice',
      email: 'alice@example.com',
      role: UserRole.ADMIN,
    });
  });

  it('wraps repository failures as HTTPError', async () => {
    repository.findById.mockRejectedValue(new Error('database down'));

    await expect(service.findUserById(7)).rejects.toBeInstanceOf(HTTPError);
  });
});
