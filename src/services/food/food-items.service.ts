import { Prisma, PrismaClient } from '@prisma/client';
import {
	CreateFoodItemDTO,
	FoodItemDTO,
	FoodItemsListDTO,
	SearchFoodItemsDTO,
	UpdateFoodItemDTO,
} from '@servemate/dto';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../../common/base.service';
import { Cache, InvalidateCacheByKeys, InvalidateCacheByPrefix } from '../../decorators/Cache';
import { HTTPError } from '../../errors/http-error.class';
import { TYPES } from '../../types';

@injectable()
export class FoodItemsService extends BaseService {
	protected serviceName = 'OrderItemsService';
	private prisma: PrismaClient;
	constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
		super();
		this.prisma = prisma;
	}

	@InvalidateCacheByPrefix('getFoodItems_')
	@InvalidateCacheByKeys((foodItem) => [`getFoodItemById_${foodItem.id}`])
	async createFoodItem(data: CreateFoodItemDTO): Promise<FoodItemDTO> {
		try {
			const newFoodItem = await this.prisma.foodItem.create({
				data,
			});
			return newFoodItem;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	@Cache(60)
	async getFoodItemById(id: number): Promise<FoodItemDTO> {
		try {
			const foodItem = await this.prisma.foodItem.findUnique({
				where: { id },
			});

			if (!foodItem) {
				throw new HTTPError(404, 'Food Items', 'Food Item not found');
			}

			return foodItem;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	@Cache(60)
	async getFoodItems(criteria: SearchFoodItemsDTO): Promise<FoodItemsListDTO> {
		try {
			const { page, pageSize, sortBy, sortOrder } = criteria;

			if (criteria.ingredients && Array.isArray(criteria.ingredients)) {
				criteria.ingredients = criteria.ingredients.filter((ing) => ing.trim() !== '');
			}

			const where = this.buildWhere<Partial<SearchFoodItemsDTO>, Prisma.FoodItemWhereInput>(
				criteria
			);

			const [foodItems, total] = await Promise.all([
				this.prisma.foodItem.findMany({
					where,
					skip: (page - 1) * pageSize,
					take: pageSize,
					orderBy: {
						[sortBy]: sortOrder,
					},
				}),
				this.prisma.foodItem.count({ where }),
			]);

			return {
				items: foodItems,
				totalCount: total,
				page,
				pageSize,
				totalPages: Math.ceil(total / pageSize),
			};
		} catch (error) {
			throw this.handleError(error);
		}
	}

	@InvalidateCacheByPrefix('getFoodItems_')
	@InvalidateCacheByKeys((foodItem) => [`getFoodItemById_${foodItem.id}`])
	async deleteFoodItem(id: number): Promise<void> {
		try {
			const foodItem = await this.prisma.foodItem.delete({
				where: { id },
			});

			if (!foodItem) {
				throw new HTTPError(404, 'Food Items', 'Food Item not found');
			}
		} catch (error) {
			throw this.handleError(error);
		}
	}

	@InvalidateCacheByPrefix('getFoodItems_')
	@InvalidateCacheByKeys((foodItem) => [`getFoodItemById_${foodItem.id}`])
	async updateFoodItem(id: number, data: UpdateFoodItemDTO): Promise<FoodItemDTO> {
		try {
			const foodItem = await this.prisma.foodItem.update({
				where: { id },
				data: {
					...data,
					updatedAt: new Date(),
				},
			});

			if (!foodItem) {
				throw new HTTPError(404, 'Food Items', 'Food Item not found');
			}

			return foodItem;
		} catch (error) {
			throw this.handleError(error);
		}
	}
}
