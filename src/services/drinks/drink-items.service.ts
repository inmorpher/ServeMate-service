import { Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../../common/base.service';
import { Cache, InvalidateCacheByKeys, InvalidateCacheByPrefix } from '../../decorators/Cache';

import {
	CreateDrinkItemDTO,
	DrinkItemDTO,
	DrinkItemsListDTO,
	SearchDrinkItemsDTO,
	UpdateDrinkItemDTO,
} from '@servemate/dto';
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

	/**
	 * Creates a new drink item in the database.
	 *
	 * @param {CreateDrinkItemDTO} data - The data for the new drink item.
	 * @returns {Promise<DrinkItemDTO>} A promise that resolves to the created drink item.
	 * @throws Will throw an error if the creation fails.
	 */
	@InvalidateCacheByPrefix('getDrinkItems_')
	@InvalidateCacheByKeys((drinkItem) => [`getDrinkItemById_${drinkItem.id}`])
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

	/**
	 * Retrieves a drink item by its unique identifier.
	 *
	 * @param {number} id - The unique identifier of the drink item.
	 * @returns {Promise<DrinkItemDTO>} A promise that resolves to the drink item data transfer object.
	 * @throws {HTTPError} If the drink item is not found or if an error occurs during retrieval.
	 */
	@Cache(60)
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

	/**
	 * Retrieves a list of drink items based on the provided search criteria.
	 *
	 * @param {SearchDrinkItemsDTO} criteria - The search criteria for retrieving drink items.
	 * @param {number} criteria.page - The page number for pagination.
	 * @param {number} criteria.pageSize - The number of items per page for pagination.
	 * @param {string} criteria.sortBy - The field to sort the results by.
	 * @param {string} criteria.sortOrder - The order to sort the results (asc or desc).
	 * @param {string[]} [criteria.ingredients] - An optional array of ingredients to filter the drink items.
	 *
	 * @returns {Promise<DrinkItemsListDTO>} A promise that resolves to a list of drink items and pagination details.
	 *
	 * @throws Will throw an error if the retrieval process fails.
	 */
	@Cache(60)
	async getDrinkItems(criteria: SearchDrinkItemsDTO): Promise<DrinkItemsListDTO> {
		try {
			const { page, pageSize, sortBy, sortOrder } = criteria;

			if (criteria.ingredients && Array.isArray(criteria.ingredients)) {
				criteria.ingredients = criteria.ingredients.filter((ing) => ing.trim() !== '');
			}

			const where = this.buildWhere<Partial<SearchDrinkItemsDTO>, Prisma.DrinkItemWhereInput>(
				criteria
			);

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

	/**
	 * Deletes a drink item from the database.
	 *
	 * @remarks
	 * This method attempts to delete a drink item identified by its unique ID.
	 * If the drink item is not found, an HTTPError with a 404 status code will be thrown.
	 * Any other errors encountered during the deletion process will be handled by the error handler.
	 *
	 * @param id - The unique identifier of the drink item to delete.
	 * @throws {HTTPError} Thrown when the drink item is not found or when an error occurs during deletion.
	 */
	@InvalidateCacheByPrefix('getDrinkItems_')
	@InvalidateCacheByKeys((drinkItem) => [`getDrinkItemById_${drinkItem.id}`])
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

	/**
	 * Updates an existing drink item with the given identifier.
	 *
	 * @param id - The unique identifier of the drink item to update.
	 * @param data - The data to update the drink item with, including any changes to its properties.
	 * @returns A promise that resolves with the updated DrinkItemDTO.
	 * @throws {HTTPError} When the drink item is not found or an error occurs during the update process.
	 */
	@InvalidateCacheByPrefix('getDrinkItems_')
	@InvalidateCacheByKeys((drinkItem) => [`getDrinkItemById_${drinkItem.id}`])
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
