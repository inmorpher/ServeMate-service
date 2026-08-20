import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import z from 'zod';
import { BaseController } from '../common/base.controller';
import { TypedRequest } from '../common/route.interface';
import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
} from '../decorators/httpDecorators';
import { ILogger } from '../logger/logger.service.interface';
import { Validate } from '../middleware/validate/validate.middleware';
import { TYPES } from '../types';
import {
  OrderCreate,
  OrderCreateSchema,
  OrderItemIdsSchema,
  OrderItemsIds,
  OrderQuery,
  OrderQuerySchema,
  OrderUpdate,
  OrderUpdateItems,
  OrderUpdateItemsSchema,
  OrderUpdateSchema,
} from './dto';
import { IOrdersService } from './orders.service.interface';

const OrderIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
type OrderIdParams = { id: number };

@injectable()
@Controller('/orders')
export class OrdersController extends BaseController {
  constructor(
    @inject(TYPES.ILogger) loggerService: ILogger,
    @inject(TYPES.OrdersService) private ordersService: IOrdersService
  ) {
    super(loggerService);
  }

  @Validate(OrderQuerySchema, 'query')
  @Get('/')
  async findOrders(
    req: TypedRequest<{}, OrderQuery, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const criteria = this.getValidated(req, 'query');
      const result = await this.ordersService.findOrders(criteria);
      this.ok(res, result);
    } catch (error) {
      next(error);
    }
  }

  @Validate(OrderQuerySchema, 'query')
  @Get('/meta')
  async getOrderMeta(
    req: TypedRequest<{}, OrderQuery, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const criteria = this.getValidated(req, 'query');
      const result = await this.ordersService.getOrderMeta(criteria);
      this.ok(res, result);
    } catch (error) {
      next(error);
    }
  }

  @Validate(OrderIdSchema, 'params')
  @Get('/:id')
  async findOrderById(
    req: TypedRequest<OrderIdParams, {}, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = this.getValidated(req, 'params');
      const order = await this.ordersService.findOrderById(id);

      if (!order) {
        this.notFound(res, 'Order not found');
        return;
      }

      this.ok(res, order);
    } catch (error) {
      next(error);
    }
  }

  @Validate(OrderCreateSchema, 'body')
  @Post('/')
  async createOrder(
    req: TypedRequest<{}, {}, OrderCreate>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = this.getValidated(req, 'body');
      await this.ordersService.createOrder(data);
      this.created(res);
    } catch (error) {
      next(error);
    }
  }

  @Validate(OrderUpdateItemsSchema, 'body')
  @Validate(OrderIdSchema, 'params')
  @Patch('/:id/items')
  async updateOrderItems(
    req: TypedRequest<OrderIdParams, {}, OrderUpdateItems>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = this.getValidated(req, 'params');
      const data = this.getValidated(req, 'body');
      await this.ordersService.updateOrderItems(id, data);
      this.noContent(res);
    } catch (error) {
      next(error);
    }
  }

  @Validate(OrderUpdateSchema, 'body')
  @Validate(OrderIdSchema, 'params')
  @Patch('/:id')
  async updateOrder(
    req: TypedRequest<OrderIdParams, {}, OrderUpdate>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = this.getValidated(req, 'params');
      const data = this.getValidated(req, 'body');
      await this.ordersService.updateOrder(id, data);
      this.noContent(res);
    } catch (error) {
      next(error);
    }
  }

  @Validate(OrderItemIdsSchema, 'body')
  @Validate(OrderIdSchema, 'params')
  @Post('/:id/print')
  async printOrderItems(
    req: TypedRequest<OrderIdParams, {}, OrderItemsIds>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = this.getValidated(req, 'params');
      const { ids } = this.getValidated(req, 'body');
      await this.ordersService.printOrderItems(id, ids);
      this.noContent(res);
    } catch (error) {
      next(error);
    }
  }

  @Validate(OrderItemIdsSchema, 'body')
  @Validate(OrderIdSchema, 'params')
  @Post('/:id/call')
  async callOrderItems(
    req: TypedRequest<OrderIdParams, {}, OrderItemsIds>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = this.getValidated(req, 'params');
      const { ids } = this.getValidated(req, 'body');
      await this.ordersService.callOrderItems(id, ids);
      this.noContent(res);
    } catch (error) {
      next(error);
    }
  }

  @Validate(OrderIdSchema, 'params')
  @Delete('/:id')
  async deleteOrder(
    req: TypedRequest<OrderIdParams, {}, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = this.getValidated(req, 'params');
      await this.ordersService.deleteOrder(id);
      this.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}
