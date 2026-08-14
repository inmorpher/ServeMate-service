import { Prisma, PrismaClient, TableCondition } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import { TableCreateDto, TableDto, TableQueryDto, TableUpdateDto } from './dto';
import {
  ITablesRepository,
  TablePagination,
  TableSort,
} from './tables.repository.interface';

const TABLE_SELECT = {
  id: true,
  tableNumber: true,
  capacity: true,
  status: true,
  additionalCapacity: true,
  isOccupied: true,
  originalCapacity: true,
  guests: true,
} satisfies Prisma.TableSelect;

@injectable()
export class TablesRepository implements ITablesRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  async findMany(
    filters: TableQueryDto,
    pagination: TablePagination,
    sort: TableSort
  ): Promise<{ tables: TableDto[]; total: number }> {
    const where = this.buildWhere(filters);
    const orderBy = {
      [sort.sortBy]: sort.sortOrder,
    } as Prisma.TableOrderByWithRelationInput;

    const [tables, total] = await Promise.all([
      this.prisma.table.findMany({
        where,
        select: TABLE_SELECT,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy,
      }),
      this.prisma.table.count({ where }),
    ]);

    return {
      tables: tables.map(table => ({
        ...table,
        status: table.status as TableCondition,
      })),
      total,
    };
  }

  async findById(id: number): Promise<TableDto | null> {
    const table = await this.prisma.table.findUnique({
      where: { id },
      select: TABLE_SELECT,
    });
    return table ? { ...table, status: table.status as TableCondition } : null;
  }

  async findByTableNumber(tableNumber: number): Promise<TableDto | null> {
    const table = await this.prisma.table.findUnique({
      where: { tableNumber },
      select: TABLE_SELECT,
    });
    return table ? { ...table, status: table.status as TableCondition } : null;
  }

  async create(data: TableCreateDto): Promise<TableDto> {
    const table = await this.prisma.table.create({
      data: {
        tableNumber: data.tableNumber,
        capacity: data.capacity,
        originalCapacity: data.capacity,
        additionalCapacity: data.additionalCapacity,
        status: data.status,
      },
      select: TABLE_SELECT,
    });
    return { ...table, status: table.status as TableCondition };
  }

  async update(id: number, data: TableUpdateDto): Promise<TableDto> {
    const table = await this.prisma.table.update({
      where: { id },
      data: {
        ...(data.tableNumber !== undefined && {
          tableNumber: data.tableNumber,
        }),
        ...(data.capacity !== undefined && {
          capacity: data.capacity,
          originalCapacity: data.capacity,
        }),
        ...(data.additionalCapacity !== undefined && {
          additionalCapacity: data.additionalCapacity,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.isOccupied !== undefined && { isOccupied: data.isOccupied }),
        ...(data.guests !== undefined && { guests: data.guests }),
      },
      select: TABLE_SELECT,
    });
    return { ...table, status: table.status as TableCondition };
  }

  async delete(id: number): Promise<void> {
    await this.prisma.table.delete({ where: { id } });
  }

  async assignTables({
    serverId,
    assignedTables,
    isPrimary,
  }: import('./dto').TableAssignmentDto): Promise<void> {
    await this.prisma.$transaction(async prisma => {
      const server = await prisma.user.findUnique({
        where: { id: serverId },
        select: { id: true },
      });

      if (!server) {
        throw new HTTPError(404, 'TablesRepository', 'Server not found');
      }

      const tables = await prisma.table.findMany({
        where: { id: { in: assignedTables } },
        select: { id: true },
      });

      if (tables.length !== assignedTables.length) {
        throw new HTTPError(
          404,
          'TablesRepository',
          'One or more tables are not found'
        );
      }

      await prisma.tableAssignment.deleteMany({ where: { serverId } });
      await prisma.tableAssignment.createMany({
        data: tables.map(table => ({
          tableId: table.id,
          serverId,
          isPrimary,
        })),
      });
    });
  }

  private buildWhere(filters: TableQueryDto): Prisma.TableWhereInput {
    const capacity = {
      ...(filters.minCapacity !== undefined && { gte: filters.minCapacity }),
      ...(filters.maxCapacity !== undefined && { lte: filters.maxCapacity }),
    };

    return {
      ...(filters.id !== undefined && { id: filters.id }),
      ...(filters.tableNumber !== undefined && {
        tableNumber: filters.tableNumber,
      }),
      ...(Object.keys(capacity).length > 0 && { capacity }),
      ...(filters.status !== undefined && { status: filters.status }),
      ...(filters.isOccupied !== undefined && {
        isOccupied: filters.isOccupied,
      }),
    };
  }
}
