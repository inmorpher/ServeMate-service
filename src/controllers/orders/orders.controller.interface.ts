import { NextFunction, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { TypedRequest } from '../../common/route.interface';
import {
	OrderCreateDTO,
	OrderSearchCriteria,
	OrderUpdateItems,
	OrderUpdateProps,
} from '../../dto/orders.dto';

/**
 * Interface for Orders Controller, extending the BaseController.
 * Provides methods for handling order-related operations.
 */
export abstract class IOrdersController extends BaseController {
	/**
	 * Retrieves orders based on the provided search criteria.
	 * @param req - The request object containing search criteria in the query parameters.
	 * @param res - The response object to send the retrieved orders.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the orders are retrieved and sent in the response.
	 */
	abstract getOrders(
		req: TypedRequest<{}, OrderSearchCriteria, {}>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Retrieves an order by its ID.
	 * @param req - The request object containing the order ID in the parameters.
	 * @param res - The response object to send the order data.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the order is retrieved and sent in the response.
	 */
	abstract getOrderById(
		req: TypedRequest<{ id: number }, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Creates a new order with the provided details.
	 * @param req - The request object containing the order creation details in the body.
	 * @param res - The response object to send the created order details.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the order is created and the response is sent.
	 */
	abstract createOrder(
		req: TypedRequest<unknown, unknown, OrderCreateDTO>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Deletes an order based on the provided order ID.
	 * @param req - The request object containing the order ID in the parameters.
	 * @param res - The response object to send the deletion confirmation.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the order is deleted and the response is sent.
	 */
	abstract deleteOrder(
		req: TypedRequest<{ id: number }, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Updates the items of an order.
	 * @param req - The request object containing the order ID in the parameters and the update details in the body.
	 * @param res - The response object to send the updated order items.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the order items are updated and the response is sent.
	 */
	abstract updateOrderItems(
		req: TypedRequest<{ id: number }, {}, OrderUpdateItems>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Updates the properties of an order.
	 * @param req - The request object containing the order ID in the parameters and the update details in the body.
	 * @param res - The response object to send the updated order properties.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the order properties are updated and the response is sent.
	 */
	abstract updateOrderProperties(
		req: TypedRequest<{ id: number }, {}, OrderUpdateProps>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Prints the items of an order.
	 * @param req - The request object containing the item IDs in the body.
	 * @param res - The response object to send the print confirmation.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the items are printed and the response is sent.
	 */
	abstract orderItemsPrint(
		req: TypedRequest<{}, {}, { ids: number[] }>,
		res: Response,
		next: NextFunction
	): Promise<void>;

	/**
	 * Calls the items of an order.
	 * @param req - The request object containing the item IDs in the body.
	 * @param res - The response object to send the call confirmation.
	 * @param next - The next middleware function in the request-response cycle.
	 * @returns A promise that resolves when the items are called and the response is sent.
	 */
	abstract orderItemsCall(
		req: TypedRequest<{}, {}, { ids: number[] }>,
		res: Response,
		next: NextFunction
	): Promise<void>;
}
