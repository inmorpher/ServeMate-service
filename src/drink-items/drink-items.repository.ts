import { Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { IDrinkItemsRepository } from './drink-items.repository.interface';
import {
  CreateDrinkItemDTO,
  DrinkItemDTO,
  DrinkItemsListDTO,
  SearchDrinkItemsDTO,
  UpdateDrinkItemDTO,
} from './dto';

const DRINK_SORT_FIELDS = new Set([
  'id',
  'name',
  'price',
  'popularityScore',
  'isAvailable',
  'createdAt',
  'updatedAt',
  'category',
  'volume',
  'alcoholPercentage',
  'isCarbonated',
  'tempriture',
]);

@injectable()
export class DrinkItemsRepository implements IDrinkItemsRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  async findMany(criteria: SearchDrinkItemsDTO): Promise<DrinkItemsListDTO> {
    const { page, pageSize } = criteria;
    const where = this.buildWhere(criteria);
    const sortBy = DRINK_SORT_FIELDS.has(criteria.sortBy)
      ? criteria.sortBy
      : 'id';
    const [items, totalCount] = await Promise.all([
      this.prisma.drinkItem.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          [sortBy]: criteria.sortOrder,
        } as Prisma.DrinkItemOrderByWithRelationInput,
      }),
      this.prisma.drinkItem.count({ where }),
    ]);
    return {
      items,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async findById(id: number): Promise<DrinkItemDTO | null> {
    return this.prisma.drinkItem.findUnique({ where: { id } });
  }
  async create(data: CreateDrinkItemDTO): Promise<DrinkItemDTO> {
    return this.prisma.drinkItem.create({ data });
  }
  async update(id: number, data: UpdateDrinkItemDTO): Promise<DrinkItemDTO> {
    return this.prisma.drinkItem.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }
  async delete(id: number): Promise<void> {
    await this.prisma.drinkItem.delete({ where: { id } });
  }

  private buildWhere(
    criteria: SearchDrinkItemsDTO
  ): Prisma.DrinkItemWhereInput {
    return {
      ...(criteria.name && {
        name: { contains: criteria.name, mode: 'insensitive' },
      }),
      ...(criteria.category && { category: criteria.category }),
      ...(criteria.isAvailable !== undefined && {
        isAvailable: criteria.isAvailable,
      }),
      ...(criteria.volume !== undefined && { volume: criteria.volume }),
      ...(criteria.ingredients?.length && {
        ingredients: { hasSome: criteria.ingredients },
      }),
    };
  }
}
