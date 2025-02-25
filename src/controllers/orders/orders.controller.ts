import {
	OrderCreateDTO,
	OrderCreateSchema,
	OrderIds,
	OrderSearchCriteria,
	OrderSearchSchema,
	OrderUpdateItems,
	OrderUpdateItemsSchema,
	OrderUpdateProps,
} from '@servemate/dto';
import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseController } from '../../common/base.controller';
import { TypedRequest } from '../../common/route.interface';
import { Controller, Delete, Get, Patch, Post } from '../../decorators/httpDecorators';
import { CacheMiddleware } from '../../middleware/cache/cache.middleware';
import { Validate } from '../../middleware/validate/validate.middleware';
import { ILogger } from '../../services/logger/logger.service.interface';
import { OrdersService } from '../../services/orders/order.service';
import { TYPES } from '../../types';

@injectable()
@Controller('/orders')
export class OrdersController extends BaseController {
	private cacheMiddleware: CacheMiddleware;
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.OrdersService) private ordersService: OrdersService
	) {
		super(loggerService);
		this.cacheMiddleware = new CacheMiddleware(this.cache, 'orders');
	}

	/**
	 * Retrieves a list of orders based on the provided search criteria.
	 *
	 * @param req - The request object containing the search criteria in the query parameters.
	 * @param res - The response object used to send back the list of orders.
	 * @param next - The next middleware function in the stack.
	 * @returns A promise that resolves to void.
	 *
	 * @remarks
	 * This method uses the `ordersService` to find orders that match the search criteria
	 * provided in the request query parameters. If the orders are found, they are sent
	 * back in the response. If an error occurs, the error is passed to the next middleware
	 * function.
	 *
	 * @example
	 * // Example request to get orders
	 * GET /orders?status=shipped&customerId=123
	 */
	@Validate(OrderSearchSchema, 'query')
	@Get('/')
	async getOrders(
		req: TypedRequest<{}, OrderSearchCriteria, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const orders = await this.ordersService.findOrders(req.query);

			this.ok(res, orders);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Retrieves an order by its ID.
	 *
	 * @param req - The request object containing the order ID in the parameters.
	 * @param res - The response object used to send the order data.
	 * @param next - The next middleware function in the stack.
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will pass any errors to the next middleware function.
	 */
	@Validate(OrderSearchSchema.pick({ id: true }), 'params')
	@Get('/:id')
	async getOrderById(
		req: TypedRequest<{ id: number }, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const order = await this.ordersService.findOrderById(Number(req.params.id));
			this.ok(res, order);
		} catch (error) {
			next(error);
		}
	}

	@Validate(OrderCreateSchema, 'body')
	@Post('/')
	async createOrder(
		req: TypedRequest<{}, {}, OrderCreateDTO>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			await this.ordersService.createOrder(req.body);

			const message = `Order for table ${req.body.tableNumber} created successfully`;
			this.loggerService.log(message);
			this.noContent(res);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Updates the food and drink items of an existing order.
	 *
	 * @param req - The request object containing the order ID in the params and the updated items in the body.
	 * @param res - The response object used to send back the updated order.
	 * @param next - The next middleware function in the stack.
	 *
	 * @returns A promise that resolves to the updated order.
	 *
	 * @throws Will pass any errors to the next middleware function.
	 */
	@Validate(OrderUpdateItemsSchema, 'body')
	@Validate(OrderSearchSchema.pick({ id: true }), 'params')
	@Patch('/:id/items')
	async updateOrderItems(
		req: TypedRequest<{ id: number }, {}, OrderUpdateItems>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			await this.ordersService.updateItemsInOrder(Number(req.params.id), req.body);
			this.noContent(res);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Updates the properties of an existing order.
	 *
	 * @param req - The request object containing the order ID in the params and the properties to update in the body.
	 * @param res - The response object used to send the updated order back to the client.
	 * @param next - The next middleware function in the stack.
	 *
	 * @throws Will pass any errors to the next middleware function.
	 *
	 * @see {@link OrderUpdateProps}
	 */
	@Validate(OrderUpdateProps, 'body')
	@Validate(OrderSearchSchema.pick({ id: true }), 'params')
	@Patch('/:id')
	async updateOrderProperties(
		req: TypedRequest<{ id: number }, {}, OrderUpdateProps>,
		res: Response,
		next: NextFunction
	) {
		try {
			const updatedOrder = await this.ordersService.updateOrderProperties(
				Number(req.params.id),
				req.body
			);
			this.noContent(res);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Handles the printing of order items.
	 *
	 * @param req - The request object containing the IDs of the order items to be printed.
	 * @param res - The response object used to send the result back to the client.
	 * @param next - The next middleware function in the stack.
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will pass any errors to the next middleware function.
	 */
	@Validate(OrderIds, 'body')
	@Post('/:id/print')
	async orderItemsPrint(
		req: TypedRequest<{}, {}, { ids: number[] }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const orderId = Number(req.params.id);
			const orderItemsIds = req.body.ids;
			await this.ordersService.printOrderItems(orderId, orderItemsIds);

			this.noContent(res);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Handles the request to call order items based on provided IDs.
	 *
	 * @param req - The request object containing an array of order item IDs in the body.
	 * @param res - The response object used to send back the called items.
	 * @param next - The next middleware function in the stack.
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will pass any errors to the next middleware function.
	 */
	@Validate(OrderIds, 'body')
	@Post('/:id/call')
	async orderItemsCall(
		req: TypedRequest<{}, {}, { orderItemsIds: number[] }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const orderId = Number(req.params.id);
			const orderItemsIds = req.body.orderItemsIds;
			await this.ordersService.callOrderItems(orderId, orderItemsIds);

			this.noContent(res);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Deletes an order by its ID.
	 *
	 * @param req - The request object containing the order ID in the parameters.
	 * @param res - The response object used to send the response.
	 * @param next - The next middleware function in the stack.
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will pass any errors to the next middleware function.
	 */
	@Validate(OrderSearchSchema.pick({ id: true }), 'params')
	@Delete('/:id')
	async deleteOrder(
		req: TypedRequest<{ id: number }, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			await this.ordersService.delete(Number(req.params.id));
			this.noContent(res);
		} catch (error) {
			next(error);
		}
	}
}
