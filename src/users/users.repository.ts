import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { UserFilters, UserListItem, UserSortColumn } from './dto';

export type UserPagination = {
  page: number;
  pageSize: number;
};

export type UserSort = {
  sortBy: UserSortColumn;
  sortOrder: 'asc' | 'desc';
};

@injectable()
export class UsersRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  async findMany(
    filters: UserFilters,
    pagination: UserPagination,
    sort: UserSort
  ): Promise<{ users: UserListItem[]; total: number }> {
    const where = this.buildWhere(filters);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: {
          [sort.sortBy]: sort.sortOrder,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      users: users.map(user => ({ ...user, role: user.role as UserRole })),
      total,
    };
  }

  async findById(id: number): Promise<UserListItem | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
    return user ? { ...user, role: user.role as UserRole } : null;
  }

  async findByEmail(email: string): Promise<UserListItem | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
    return user ? { ...user, role: user.role as UserRole } : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  async create(data: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
  }) {
    return this.prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
      email?: string;
      role?: UserRole;
      isActive?: boolean;
      lastLogin?: Date | null;
    }
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async countActiveOrdersByServer(serverId: number): Promise<number> {
    return this.prisma.order.count({
      where: { serverId },
    });
  }

  private buildWhere(filters: UserFilters): Prisma.UserWhereInput {
    return {
      ...(filters.id !== undefined && { id: filters.id }),
      ...(filters.email && {
        email: { contains: filters.email, mode: 'insensitive' as const },
      }),
      ...(filters.name && {
        name: { contains: filters.name, mode: 'insensitive' as const },
      }),
      ...(filters.role && { role: filters.role }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.createdAfter && { createdAt: { gte: filters.createdAfter } }),
      ...(filters.createdBefore && {
        createdAt: { lte: filters.createdBefore },
      }),
    };
  }
}
