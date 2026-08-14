import { UserRole } from '@prisma/client';
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
import { Roles } from '../decorators/Roles';
import { Validate } from '../middleware/validate/validate.middleware';
import { ILogger } from '../services/logger/logger.service.interface';
import { TYPES } from '../types';
import { IDrinkItemsService } from './drink-items.service.interface';
import {
  CreateDrinkItemDTO,
  createDrinkItemSchema,
  DrinkItemParamsDto,
  DrinkItemParamsSchema,
  SearchDrinkItemsDTO,
  searchDrinkItemsSchema,
  UpdateDrinkItemDTO,
  updateDrinkItemSchema,
} from './dto';

export type DrinkItemsControllerService = Pick<
  IDrinkItemsService,
  | 'findDrinkItems'
  | 'findDrinkItemById'
  | 'createDrinkItem'
  | 'updateDrinkItem'
  | 'deleteDrinkItem'
>;

@injectable()
@Controller('/drink-items')
export class DrinkItemsController extends BaseController {
  constructor(
    @inject(TYPES.ILogger) logger: ILogger,
    @inject(TYPES.DrinkItemsService)
    private service: DrinkItemsControllerService
  ) {
    super(logger);
  }

  @Validate(createDrinkItemSchema, 'body')
  @Post('/')
  @Roles([UserRole.ADMIN, UserRole.MANAGER])
  async create(
    req: TypedRequest<{}, {}, CreateDrinkItemDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      this.ok(
        res,
        await this.service.createDrinkItem(this.getValidated(req, 'body'))
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(searchDrinkItemsSchema, 'query')
  @Get('/')
  async findAll(
    req: TypedRequest<{}, SearchDrinkItemsDTO, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      this.ok(
        res,
        await this.service.findDrinkItems(this.getValidated(req, 'query'))
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(DrinkItemParamsSchema, 'params')
  @Get('/:id')
  async findOne(
    req: TypedRequest<DrinkItemParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const item = await this.service.findDrinkItemById(
        this.getValidated(req, 'params').id
      );
      if (!item) {
        this.notFound(res, 'Drink Item not found');
        return;
      }
      this.ok(res, item);
    } catch (error) {
      next(error);
    }
  }

  @Validate(updateDrinkItemSchema, 'body')
  @Validate(DrinkItemParamsSchema, 'params')
  @Patch('/:id')
  @Roles([UserRole.ADMIN, UserRole.MANAGER])
  async update(
    req: TypedRequest<DrinkItemParamsDto, {}, UpdateDrinkItemDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      this.ok(
        res,
        await this.service.updateDrinkItem(
          this.getValidated(req, 'params').id,
          this.getValidated(req, 'body')
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(DrinkItemParamsSchema, 'params')
  @Delete('/:id')
  @Roles([UserRole.ADMIN, UserRole.MANAGER])
  async delete(
    req: TypedRequest<DrinkItemParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await this.service.deleteDrinkItem(this.getValidated(req, 'params').id);
      this.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}
