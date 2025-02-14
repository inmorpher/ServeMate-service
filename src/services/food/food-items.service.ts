import { Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../../common/base.service';
import {
	CreateFoodItemDTO,
	FoodItemDTO,
	FoodItemsListDTO,
	SearchFoodItemsDTO,
	UpdateFoodItemDTO,
} from '../../dto/items.dto';
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

	async getFoodItems(criteria: SearchFoodItemsDTO): Promise<FoodItemsListDTO> {
		try {
			const { page, pageSize, sortBy, sortOrder } = criteria;

			if (typeof criteria.ingredients && Array.isArray(criteria.ingredients)) {
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
	// 	// Food Items CRUD
	// 	async createFoodItem(data: CreateFoodItemDto): Promise<FoodItem> {
	// 		try {
	// 			const foodItem = await this.prisma.foodItem.create({
	// 				data,
	// 			});
	// 			return foodItem;
	// 		} catch (error) {
	// 			// Ensure the function always returns a FoodItem or throws an error
	// 		}
	// 	}

	// 	async getFoodItem(id: number): Promise<FoodItem | null> {
	// 		return this.prisma.foodItem.findUnique({
	// 			where: { id },
	// 		});
	// 	}

	// 	async getAllFoodItems(): Promise<FoodItem[]> {
	// 		return this.prisma.foodItem.findMany();
	// 	}

	// 	async updateFoodItem(id: number, data: UpdateFoodItemDto): Promise<FoodItem> {
	// 		return this.prisma.foodItem.update({
	// 			where: { id },
	// 			data,
	// 		});
	// 	}

	// 	async deleteFoodItem(id: number): Promise<FoodItem> {
	// 		return this.prisma.foodItem.delete({
	// 			where: { id },
	// 		});
	// 	}

	// 	// Drink Items CRUD
	// 	async createDrinkItem(data: CreateDrinkItemDto): Promise<DrinkItem> {
	// 		return this.prisma.drinkItem.create({
	// 			data,
	// 		});
	// 	}

	// 	async getDrinkItem(id: number): Promise<DrinkItem | null> {
	// 		return this.prisma.drinkItem.findUnique({
	// 			where: { id },
	// 		});
	// 	}

	// 	async getAllDrinkItems(): Promise<DrinkItem[]> {
	// 		return this.prisma.drinkItem.findMany();
	// 	}

	// 	async updateDrinkItem(id: number, data: UpdateDrinkItemDto): Promise<DrinkItem> {
	// 		return this.prisma.drinkItem.update({
	// 			where: { id },
	// 			data,
	// 		});
	// 	}

	// 	async deleteDrinkItem(id: number): Promise<DrinkItem> {
	// 		return this.prisma.drinkItem.delete({
	// 			where: { id },
	// 		});
	// 	}
	// }
}
