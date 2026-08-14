import { Prisma } from '@prisma/client';
import {
  TableAssignmentDto,
  TableCreateDto,
  TableDto,
  TableQueryDto,
  TableUpdateDto,
} from './dto';

export type TablePagination = {
  page: number;
  pageSize: number;
};

export type TableSort = {
  sortBy: TableQueryDto['sortBy'];
  sortOrder: TableQueryDto['sortOrder'];
};

export interface ITablesRepository {
  findMany(
    filters: TableQueryDto,
    pagination: TablePagination,
    sort: TableSort
  ): Promise<{ tables: TableDto[]; total: number }>;
  findById(id: number): Promise<TableDto | null>;
  findByTableNumber(tableNumber: number): Promise<TableDto | null>;
  create(data: TableCreateDto): Promise<TableDto>;
  update(id: number, data: TableUpdateDto): Promise<TableDto>;
  delete(id: number): Promise<void>;
  assignTables(data: TableAssignmentDto): Promise<void>;
}

export type TableWhereInput = Prisma.TableWhereInput;
