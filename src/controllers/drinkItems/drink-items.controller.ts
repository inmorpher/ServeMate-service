import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseController } from '../../common/base.controller';
import { TypedRequest } from '../../common/route.interface';
import { Controller, Delete, Get, Patch, Post } from '../../decorators/httpDecorators';
import {
	CreateDrinkItemDTO,
	createDrinkItemSchema,
	drinkItemSchema,
	SearchDrinkItemsDTO,
	searchDrinkItemsSchema,
	updateDrinkItemSchema,
} from '../../dto/items.dto';
import { Validate } from '../../middleware/validate/validate.middleware';
import { DrinkItemsService } from '../../services/drinks/drink-items.service';
import { ILogger } from '../../services/logger/logger.service.interface';
import { TYPES } from '../../types';

@injectable()
@Controller('/drink-items')
export class DrinkItemsController extends BaseController {
	constructor(
		@inject(TYPES.DrinkItemsService) private drinkItemsService: DrinkItemsService,
		@inject(TYPES.ILogger) loggerService: ILogger
	) {
		super(loggerService);
	}

	@Validate(createDrinkItemSchema, 'body')
	@Post('/')
	async createDrinkItem(
		req: TypedRequest<{}, {}, CreateDrinkItemDTO>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const drinkItem = await this.drinkItemsService.createDrinkItem(req.body);
			this.ok(res, drinkItem);
		} catch (error) {
			next(error);
		}
	}

	@Validate(drinkItemSchema.pick({ id: true }), 'params')
	@Get('/:id')
	async getDrinkItem(
		req: TypedRequest<{ id: number }, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const drinkItem = await this.drinkItemsService.getDrinkItemById(Number(req.params.id));
			this.ok(res, drinkItem);
		} catch (error) {
			next(error);
		}
	}

	@Validate(searchDrinkItemsSchema, 'query')
	@Get('/')
	async getDrinkItems(
		req: TypedRequest<{}, SearchDrinkItemsDTO, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const drinkItems = await this.drinkItemsService.getDrinkItems(req.query);
			this.ok(res, drinkItems);
		} catch (error) {
			next(error);
		}
	}

	@Validate(drinkItemSchema.pick({ id: true }), 'params')
	@Delete('/:id')
	async deleteDrinkItem(
		req: TypedRequest<{ id: number }, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			await this.drinkItemsService.deleteDrinkItem(Number(req.params.id));
			this.noContent(res);
		} catch (error) {
			next(error);
		}
	}

	@Validate(updateDrinkItemSchema.partial(), 'body')
	@Validate(drinkItemSchema.pick({ id: true }), 'params')
	@Patch('/:id')
	async updateDrinkItem(
		req: TypedRequest<{ id: number }, {}, CreateDrinkItemDTO>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			console.log('req.body', req.body);
			const updatedDrinkItem = await this.drinkItemsService.updateDrinkItem(
				Number(req.params.id),
				req.body
			);
			this.ok(res, updatedDrinkItem);
		} catch (error) {
			next(error);
		}
	}
}
