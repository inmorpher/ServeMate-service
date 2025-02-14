import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseController } from '../../common/base.controller';
import { TypedRequest } from '../../common/route.interface';
import { Controller, Delete, Get, Patch, Post } from '../../decorators/httpDecorators';
import {
	CreateFoodItemDTO,
	createFoodItemSchema,
	foodItemSchema,
	SearchFoodItemsDTO,
	searchFoodItemsSchema,
	updateFoodItemSchema,
} from '../../dto/items.dto';
import { Validate } from '../../middleware/validate/validate.middleware';
import { FoodItemsService } from '../../services/food/food-items.service';
import { ILogger } from '../../services/logger/logger.service.interface';
import { TYPES } from '../../types';

@injectable()
@Controller('/food-items')
export class FoodItemsController extends BaseController {
	constructor(
		@inject(TYPES.FoodItemsService) private foodItemsService: FoodItemsService,
		@inject(TYPES.ILogger) loggerService: ILogger
	) {
		super(loggerService);
	}

	@Validate(createFoodItemSchema, 'body')
	@Post('/')
	/**
	 * Creates a new food item.
	 *
	 * This method handles the creation of a food item by leveraging the foodItemsService.
	 * It extracts the food item data from the request body.
	 *
	 * @param req - The HTTP request containing the food item data in its body.
	 * @param res - The HTTP response object used to return the created food item.
	 * @param next - The next middleware function in the Express request-response cycle.
	 *
	 * @returns A Promise that resolves to void.
	 *
	 * @throws Will pass any error caught during the process to the next middleware.
	 */
	async createFoodItem(
		req: TypedRequest<{}, {}, CreateFoodItemDTO>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const foodItem = await this.foodItemsService.createFoodItem(req.body);
			this.ok(res, foodItem);
		} catch (error) {
			next(error);
		}
	}

	@Validate(foodItemSchema.pick({ id: true }), 'params')
	@Get('/:id')
	/**
	 * Retrieves a food item by its identifier.
	 *
	 * @async
	 * @function getFoodItem
	 * @param {TypedRequest<{ id: number }, {}, {}>} req - The incoming request containing the food item id in the parameters.
	 * @param {Response} res - The HTTP response object used to send back the requested food item.
	 * @param {NextFunction} next - The next middleware function to handle errors.
	 * @returns {Promise<void>} A promise that resolves when the operation completes.
	 * @throws Will forward any error encountered during retrieval to the next middleware.
	 */
	async getFoodItem(
		req: TypedRequest<{ id: number }, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const foodItem = await this.foodItemsService.getFoodItemById(Number(req.params.id));
			this.ok(res, foodItem);
		} catch (error) {
			next(error);
		}
	}

	@Validate(searchFoodItemsSchema, 'query')
	@Get('/')
	/**
	 * Retrieves a list of food items based on the provided query parameters.
	 *
	 * @param req - The HTTP request object containing the query parameters of type SearchFoodItemsDTO.
	 * @param res - The HTTP response object used to send a successful response with the retrieved food items.
	 * @param next - The callback function to pass control to the next middleware in case of an error.
	 *
	 * @returns A promise that resolves when the food items have been successfully retrieved and sent in the response.
	 *
	 * @throws Forwards any encountered error to the next error handling middleware.
	 */
	async getFoodItems(
		req: TypedRequest<{}, SearchFoodItemsDTO, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const foodItems = await this.foodItemsService.getFoodItems(req.query);
			this.ok(res, foodItems);
		} catch (error) {
			next(error);
		}
	}

	@Validate(foodItemSchema.pick({ id: true }), 'params')
	@Delete('/:id')
	/**
	 * @description Deletes a food item by its ID.
	 * @param {TypedRequest<{ id: number }, {}, {}>} req - The request object containing the ID of the food item to delete in the parameters.
	 * @param {Response} res - The response object.
	 * @param {NextFunction} next - The next function to pass control to the next middleware.
	 * @returns {Promise<void>} - A promise that resolves when the food item is successfully deleted.
	 * @throws {Error} - If an error occurs during the deletion process, it is passed to the next middleware.
	 */
	async deleteFoodItem(
		req: TypedRequest<{ id: number }, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			await this.foodItemsService.deleteFoodItem(Number(req.params.id));
			this.noContent(res);
		} catch (error) {
			next(error);
		}
	}

	@Validate(updateFoodItemSchema.partial(), 'body')
	@Validate(foodItemSchema.pick({ id: true }), 'params')
	@Patch('/:id')
	/**
	 * Updates an existing food item with the provided data.
	 *
	 * @param req - The request object containing the food item ID in the params and the updated data in the body.
	 * @param res - The response object used to send the updated food item back to the client.
	 * @param next - The next middleware function in the stack, used to handle any errors that occur during the update process.
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will pass any errors to the next middleware function.
	 */
	async updateFoodItem(
		req: TypedRequest<{ id: number }, {}, CreateFoodItemDTO>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const updatedFoodItem = await this.foodItemsService.updateFoodItem(
				Number(req.params.id),
				req.body
			);
			this.ok(res, updatedFoodItem);
		} catch (error) {
			next(error);
		}
	}
}
