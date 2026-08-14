import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseController } from '../common/base.controller';
import { TypedRequest } from '../common/route.interface';
import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
} from '../decorators/httpDecorators';
import { Validate } from '../middleware/validate/validate.middleware';
import { ILogger } from '../services/logger/logger.service.interface';
import { TYPES } from '../types';
import {
  CreateFoodItemDTO,
  createFoodItemSchema,
  FoodItemParamsDto,
  FoodItemParamsSchema,
  SearchFoodItemsDTO,
  searchFoodItemsSchema,
  UpdateFoodItemDTO,
  updateFoodItemSchema,
} from './dto';
import { IFoodItemsService } from './food-items.service.interface';

export type FoodItemsControllerService = Pick<
  IFoodItemsService,
  | 'findFoodItems'
  | 'findFoodItemById'
  | 'createFoodItem'
  | 'updateFoodItem'
  | 'deleteFoodItem'
>;

@injectable()
@Controller('/food-items')
export class FoodItemsController extends BaseController {
  constructor(
    @inject(TYPES.ILogger) logger: ILogger,
    @inject(TYPES.FoodItemsService) private service: FoodItemsControllerService
  ) {
    super(logger);
  }

  @Validate(createFoodItemSchema, 'body')
  @Post('/')
  async create(
    req: TypedRequest<{}, {}, CreateFoodItemDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      this.ok(
        res,
        await this.service.createFoodItem(this.getValidated(req, 'body'))
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(searchFoodItemsSchema, 'query')
  @Get('/')
  async findAll(
    req: TypedRequest<{}, SearchFoodItemsDTO, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      this.ok(
        res,
        await this.service.findFoodItems(this.getValidated(req, 'query'))
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(FoodItemParamsSchema, 'params')
  @Get('/:id')
  async findOne(
    req: TypedRequest<FoodItemParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const item = await this.service.findFoodItemById(
        this.getValidated(req, 'params').id
      );
      if (!item) {
        this.notFound(res, 'Food Item not found');
        return;
      }
      this.ok(res, item);
    } catch (error) {
      next(error);
    }
  }

  @Validate(updateFoodItemSchema, 'body')
  @Validate(FoodItemParamsSchema, 'params')
  @Patch('/:id')
  async update(
    req: TypedRequest<FoodItemParamsDto, {}, UpdateFoodItemDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      this.ok(
        res,
        await this.service.updateFoodItem(
          this.getValidated(req, 'params').id,
          this.getValidated(req, 'body')
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(FoodItemParamsSchema, 'params')
  @Delete('/:id')
  async delete(
    req: TypedRequest<FoodItemParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await this.service.deleteFoodItem(this.getValidated(req, 'params').id);
      this.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}
