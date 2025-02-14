import { Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../../common/base.service';
import {
	CreateDrinkItemDTO,
	DrinkItemDTO,
	DrinkItemsListDTO,
	SearchDrinkItemsDTO,
	UpdateDrinkItemDTO,
} from '../../dto/items.dto';
import { HTTPError } from '../../errors/http-error.class';
import { TYPES } from '../../types';

@injectable()
export class DrinkItemsService extends BaseService {
	protected serviceName = 'DrinkItemsService';
	private prisma: PrismaClient;

	constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
		super();
		this.prisma = prisma;
	}

	async createDrinkItem(data: CreateDrinkItemDTO): Promise<DrinkItemDTO> {
		try {
			const newDrinkItem = await this.prisma.drinkItem.create({
				data,
			});
			return newDrinkItem;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async getDrinkItemById(id: number): Promise<DrinkItemDTO> {
		try {
			const drinkItem = await this.prisma.drinkItem.findUnique({
				where: { id },
			});

			if (!drinkItem) {
				throw new HTTPError(404, 'Drink Items', 'Drink Item not found');
			}

			return drinkItem;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async getDrinkItems(criteria: SearchDrinkItemsDTO): Promise<DrinkItemsListDTO> {
		try {
			const { page, pageSize, sortBy, sortOrder } = criteria;

			if (criteria.ingredients && Array.isArray(criteria.ingredients)) {
				criteria.ingredients = criteria.ingredients.filter((ing) => ing.trim() !== '');
			}

			const where = this.buildWhere<Partial<SearchDrinkItemsDTO>, Prisma.DrinkItemWhereInput>(
				criteria
			);

			console.log('where', where);
			console.log('criteria', criteria);

			const [drinkItems, total] = await Promise.all([
				this.prisma.drinkItem.findMany({
					where,
					skip: (page - 1) * pageSize,
					take: pageSize,
					orderBy: {
						[sortBy]: sortOrder,
					},
				}),
				this.prisma.drinkItem.count({ where }),
			]);

			return {
				items: drinkItems,
				totalCount: total,
				page,
				pageSize,
				totalPages: Math.ceil(total / pageSize),
			};
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async deleteDrinkItem(id: number): Promise<void> {
		try {
			const drinkItem = await this.prisma.drinkItem.delete({
				where: { id },
			});

			if (!drinkItem) {
				throw new HTTPError(404, 'Drink Items', 'Drink Item not found');
			}
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async updateDrinkItem(id: number, data: UpdateDrinkItemDTO): Promise<DrinkItemDTO> {
		try {
			console.log('data', data);
			const drinkItem = await this.prisma.drinkItem.update({
				where: { id },
				data: {
					...data,
					updatedAt: new Date(),
				},
			});

			if (!drinkItem) {
				throw new HTTPError(404, 'Drink Items', 'Drink Item not found');
			}

			return drinkItem;
		} catch (error) {
			throw this.handleError(error);
		}
	}
}
