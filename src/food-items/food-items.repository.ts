import { Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import {
  CreateFoodItemDTO,
  FoodItemDTO,
  FoodItemsListDTO,
  SearchFoodItemsDTO,
  UpdateFoodItemDTO,
} from './dto';
import { IFoodItemsRepository } from './food-items.repository.interface';

const FOOD_SORT_FIELDS = new Set([
  'id',
  'name',
  'price',
  'popularityScore',
  'isAvailable',
  'createdAt',
  'updatedAt',
  'type',
  'category',
  'preparationTime',
  'spicyLevel',
  'calories',
  'isVegan',
  'isGlutenFree',
]);

@injectable()
export class FoodItemsRepository implements IFoodItemsRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  async findMany(criteria: SearchFoodItemsDTO): Promise<FoodItemsListDTO> {
    const { page, pageSize } = criteria;
    const where = this.buildWhere(criteria);
    const sortBy = FOOD_SORT_FIELDS.has(criteria.sortBy)
      ? criteria.sortBy
      : 'id';
    const [items, totalCount] = await Promise.all([
      this.prisma.foodItem.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          [sortBy]: criteria.sortOrder,
        } as Prisma.FoodItemOrderByWithRelationInput,
      }),
      this.prisma.foodItem.count({ where }),
    ]);
    return {
      items: items.map(item => this.toDto(item)),
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async findById(id: number): Promise<FoodItemDTO | null> {
    const item = await this.prisma.foodItem.findUnique({ where: { id } });
    return item ? this.toDto(item) : null;
  }

  async create(data: CreateFoodItemDTO): Promise<FoodItemDTO> {
    const item = await this.prisma.foodItem.create({
      data: this.toPrismaData(data),
    });
    return this.toDto(item);
  }

  async update(id: number, data: UpdateFoodItemDTO): Promise<FoodItemDTO> {
    const item = await this.prisma.foodItem.update({
      where: { id },
      data: { ...this.toPrismaData(data), updatedAt: new Date() },
    });
    return this.toDto(item);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.foodItem.delete({ where: { id } });
  }

  private buildWhere(criteria: SearchFoodItemsDTO): Prisma.FoodItemWhereInput {
    return {
      ...(criteria.name && {
        name: { contains: criteria.name, mode: 'insensitive' },
      }),
      ...(criteria.category && { category: criteria.category }),
      ...(criteria.type && { type: criteria.type }),
      ...(criteria.isAvailable !== undefined && {
        isAvailable: criteria.isAvailable,
      }),
      ...(criteria.isVegan !== undefined && { isVegan: criteria.isVegan }),
      ...(criteria.isGlutenFree !== undefined && {
        isGlutenFree: criteria.isGlutenFree,
      }),
      ...(criteria.isVegetarian !== undefined && {
        isVegetarian: criteria.isVegetarian,
      }),
      ...(criteria.price !== undefined && { price: criteria.price }),
      ...(criteria.ingredients?.length && {
        ingredients: { hasSome: criteria.ingredients },
      }),
    };
  }

  private toPrismaData(
    data: CreateFoodItemDTO | UpdateFoodItemDTO
  ): Prisma.FoodItemUncheckedCreateInput {
    const { allergies: _allergies, ...foodData } = data as CreateFoodItemDTO & {
      allergies?: unknown;
    };
    return foodData as Prisma.FoodItemUncheckedCreateInput;
  }

  private toDto(item: Prisma.FoodItemGetPayload<{}>): FoodItemDTO {
    return { ...item, allergies: [] } as FoodItemDTO;
  }
}
