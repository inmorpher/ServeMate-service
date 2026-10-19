import { DrinkCategory, Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { IDrinkItemsRepository } from './drink-items.repository.interface';
import {
  CreateDrinkItemDTO,
  DrinkItemDTO,
  DrinkItemsListDTO,
  DrinkMetaDto,
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
  async getMeta(): Promise<DrinkMetaDto> {
    const [ranges, items] = await Promise.all([
      this.prisma.drinkItem.aggregate({
        _min: { price: true, volume: true },
        _max: { price: true, volume: true },
      }),
      this.prisma.drinkItem.findMany({ select: { ingredients: true } }),
    ]);

    return {
      categories: Object.values(DrinkCategory),
      ingredients: [...new Set(items.flatMap(item => item.ingredients))].sort(),
      availabilityStates: [true, false],
      volumeRange: {
        min: ranges._min.volume ?? 0,
        max: ranges._max.volume ?? 0,
      },
      priceRange: {
        min: Math.floor(ranges._min.price ?? 0),
        max: Math.ceil(ranges._max.price ?? 0),
      },
    };
  }

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
