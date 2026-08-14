import { UserRole } from '@prisma/client';
import { UsersRepository } from '../../users/users.repository';

const prismaMock = () => ({
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  order: {
    count: jest.fn(),
  },
});

const selectedUser = {
  id: 7,
  name: 'Alice',
  email: 'alice@example.com',
  role: UserRole.ADMIN,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLogin: null,
};

describe('UsersRepository', () => {
  it('builds user filters and pagination for findMany', async () => {
    const prisma = prismaMock();
    prisma.user.findMany.mockResolvedValue([selectedUser]);
    prisma.user.count.mockResolvedValue(1);
    const repository = new UsersRepository(prisma as any);

    await expect(
      repository.findMany(
        {
          email: 'example.com',
          name: 'Ali',
          role: UserRole.ADMIN,
          isActive: true,
          createdAfter: new Date('2026-01-01T00:00:00.000Z'),
        },
        { page: 2, pageSize: 10 },
        { sortBy: 'name', sortOrder: 'desc' }
      )
    ).resolves.toEqual({ users: [selectedUser], total: 1 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: { contains: 'example.com', mode: 'insensitive' },
          name: { contains: 'Ali', mode: 'insensitive' },
          role: UserRole.ADMIN,
          isActive: true,
          createdAt: { gte: new Date('2026-01-01T00:00:00.000Z') },
        },
        skip: 10,
        take: 10,
        orderBy: { name: 'desc' },
      })
    );
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: expect.any(Object),
    });
  });

  it('maps findById and findByEmail results', async () => {
    const prisma = prismaMock();
    prisma.user.findUnique
      .mockResolvedValueOnce(selectedUser)
      .mockResolvedValueOnce(null);
    const repository = new UsersRepository(prisma as any);

    await expect(repository.findById(7)).resolves.toEqual(selectedUser);
    await expect(
      repository.findByEmail('missing@example.com')
    ).resolves.toBeNull();
  });

  it('creates, updates and deletes users with the expected Prisma payloads', async () => {
    const prisma = prismaMock();
    prisma.user.create.mockResolvedValue({
      id: 7,
      name: 'Alice',
      email: 'alice@example.com',
      role: UserRole.ADMIN,
    });
    prisma.user.update.mockResolvedValue(selectedUser);
    prisma.user.delete.mockResolvedValue(selectedUser);
    const repository = new UsersRepository(prisma as any);

    await repository.create({
      name: 'Alice',
      email: 'alice@example.com',
      role: UserRole.ADMIN,
      password: 'hashed',
    });
    await repository.update(7, { isActive: false });
    await repository.delete(7);

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Alice',
          email: 'alice@example.com',
          role: UserRole.ADMIN,
          password: 'hashed',
        },
      })
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { isActive: false },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it('counts active orders and verifies credentials', async () => {
    const prisma = prismaMock();
    prisma.order.count.mockResolvedValue(3);
    prisma.user.findUnique.mockResolvedValue({
      ...selectedUser,
      password: '$2b$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuu',
    });
    const repository = new UsersRepository(prisma as any);

    await expect(repository.countActiveOrdersByServer(7)).resolves.toBe(3);
    await expect(
      repository.verifyCredentials('alice@example.com', 'secret123')
    ).rejects.toThrow('Invalid password');
    expect(prisma.order.count).toHaveBeenCalledWith({ where: { serverId: 7 } });
  });
});
