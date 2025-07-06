import { OrderState, Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';

import { Cache, InvalidateCacheByKeys, InvalidateCacheByPrefix } from '../../decorators/Cache';

import {
	OrderCreateDTO,
	OrderFullSingleDTO,
	OrderSearchCriteria,
	OrderSearchListResult,
	OrderUpdateProps,
} from '@servemate/dto';
import 'reflect-metadata';
import { HTTPError } from '../../errors/http-error.class';
import { TYPES } from '../../types';
import { AbstractOrderService, ORDER_INCLUDE } from './abstract-order.service';

@injectable()
export class OrdersService extends AbstractOrderService {
	protected serviceName = 'OrdersService';

	constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
		super(prisma);
		this.prisma = prisma;
	}

	/**
	 * Finds orders based on the provided search criteria.
	 *
	 * @param {OrderSearchCriteria} criteria - The criteria to search for orders.
	 * @param {number} [criteria.id] - The ID of the order.
	 * @param {number} [criteria.server] - The ID of the server.
	 * @param {string} [criteria.status] - The status of the order.
	 * @param {number} [criteria.tableNumber] - The table number associated with the order.
	 * @param {number} [criteria.guestNumber] - The number of guests for the order.
	 * @param {string[]} [criteria.allergies] - The list of allergies associated with the order.
	 * @param {number} [criteria.page] - The page number for pagination.
	 * @param {number} [criteria.pageSize] - The number of orders per page.
	 * @param {string} [criteria.sortBy] - The field to sort the orders by.
	 * @param {string} [criteria.sortOrder] - The order direction (asc/desc) for sorting.
	 * @returns {Promise<any>} A promise that resolves to an object containing the orders, total count, current page, page size, and total pages.
	 * @throws Will throw an error if the operation fails.
	 */

	@Cache(60)
	async findOrders(criteria: OrderSearchCriteria): Promise<OrderSearchListResult> {
		try {
			const { page, pageSize, sortBy, sortOrder, serverName } = criteria;

			const where = this.buildWhere<Partial<OrderSearchCriteria>, Prisma.OrderWhereInput>(criteria);

			const [orders, total, priceStats] = await Promise.all([
				this.prisma.order.findMany({
					where: {
						...where,
						totalAmount: this.buildRangeWhere(criteria.minAmount, criteria.maxAmount),
						server: serverName
							? {
									name: {
										contains: criteria.serverName,
										mode: 'insensitive',
									},
								}
							: undefined,
					},

					select: {
						id: true,
						status: true,
						server: {
							select: { name: true, id: true },
						},
						tableNumber: true,
						guestsCount: true,
						orderTime: true,
						completionTime: true,
						updatedAt: true,
						allergies: true,
						comments: true,
						totalAmount: true,

						discount: true,
						tip: true,
					},
					skip: (page - 1) * pageSize,
					take: pageSize,
					orderBy: {
						[sortBy]: sortOrder,
					},
				}),
				this.prisma.order.count({
					where: {
						...where,
						server: serverName
							? {
									name: {
										contains: criteria.serverName,
										mode: 'insensitive',
									},
								}
							: undefined,
					},
				}),
				this.prisma.order.aggregate({
					where: {
						...where,
						totalAmount: this.buildRangeWhere(criteria.minAmount, criteria.maxAmount),
						server: serverName
							? {
									name: {
										contains: criteria.serverName,
										mode: 'insensitive',
									},
								}
							: undefined,
					},
					_min: {
						totalAmount: true,
					},
					_max: {
						totalAmount: true,
					},
				}),
			]);

			return {
				orders: orders.map((order) => ({
					...order,
					status: order.status as OrderState,
				})),
				priceRange: {
					min: priceStats._min.totalAmount ?? 0,
					max: priceStats._max.totalAmount ?? 0,
				},
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
	 * Finds an order by its ID and returns the full order details.
	 *
	 * @param {number} orderId - The ID of the order to find.
	 * @returns {Promise<OrderFullSingleDTO>} A promise that resolves to the full order details.
	 * @throws Will throw an error if the order is not found or if there is an issue with the database query.
	 */
	@Cache(60)
	async findOrderById(orderId: number): Promise<OrderFullSingleDTO> {
		try {
			const order = await this.prisma.order.findUnique({
				where: { id: orderId },
				include: ORDER_INCLUDE,
			});

			// If no order found, throw an error
			if (!order) {
				throw new HTTPError(
					404,
					this.serviceName,
					'Order not found in the database',
					`/orders/${orderId}`
				);
			}

			return {
				...order,
				foodItems: this.groupItems(order.foodItems),
				drinkItems: this.groupItems(order.drinkItems),
			};
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Creates a new order in the system.
	 *
	 * This function performs the following steps:
	 * 1. Validates and corrects the prices of food and drink items.
	 * 2. Calculates the total amount of the order.
	 * 3. Flattens the food and drink items for database operations.
	 * 4. Creates the order in the database.
	 *
	 * @param {OrderCreateDTO} order - The order data transfer object containing all necessary information to create an order.
	 *                                 This includes food items, drink items, and other order details.
	 *
	 * @returns {Promise<OrderFullSingleDTO>} A promise that resolves to the newly created order,
	 *                                        including all details and the assigned order ID.
	 *
	 * @throws {Error} If there's any issue during the order creation process, an error is thrown and handled.
	 */
	@InvalidateCacheByPrefix(`findOrders_`)
	async createOrder(order: OrderCreateDTO): Promise<OrderFullSingleDTO> {
		try {
			const { mergedItems, totalAmount } = await this.prepareOrderItems(order);

			return await this.createOrderInDatabase({
				...order,
				flattenedFoodItems: mergedItems.foodItems,
				flattenedDrinkItems: mergedItems.drinkItems,
				totalAmount,
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Deletes an order and all its associated food and drink items from the database.
	 *
	 * @param {number} order - The ID of the order to be deleted.
	 * @returns {Promise<boolean>} - A promise that resolves to `true` if the deletion was successful.
	 * @throws Will throw an error if the deletion fails.
	 */
	@InvalidateCacheByPrefix(`findOrders_`)
	@InvalidateCacheByKeys((orderId) => [`findOrderById_[${orderId}]`])
	async delete(order: number): Promise<void> {
		try {
			await this.prisma.$transaction(async (prisma) => {
				// Check if order exists
				const existingOrder = await prisma.order.findUnique({
					where: { id: order },
					select: {
						id: true,
						payments: {
							select: {
								id: true,
							},
						},
						foodItems: {
							select: {
								id: true,
								printed: true,
								fired: true,
								paymentStatus: true,
							},
						},
						drinkItems: {
							select: {
								id: true,
								printed: true,
								fired: true,
								paymentStatus: true,
							},
						},
					},
				});

				if (!existingOrder) {
					throw new HTTPError(404, this.serviceName, 'Order not found', `/orders/${order}`);
				}

				// Check if any payments are associated with this order
				if (existingOrder.payments.length > 0) {
					throw new HTTPError(
						400,
						this.serviceName,
						'Cannot delete order with associated payments',
						`/orders/${order}`
					);
				}

				// Check if any food or drink items have been printed or fired
				const printedFoodItems = existingOrder.foodItems.filter((item) => item.printed);
				const printedDrinkItems = existingOrder.drinkItems.filter((item) => item.printed);
				const firedFoodItems = existingOrder.foodItems.filter((item) => item.fired);
				const firedDrinkItems = existingOrder.drinkItems.filter((item) => item.fired);

				if (printedFoodItems.length > 0 || printedDrinkItems.length > 0) {
					throw new HTTPError(
						400,
						this.serviceName,
						'Cannot delete order with printed items',
						`/orders/${order}`
					);
				}

				if (firedFoodItems.length > 0 || firedDrinkItems.length > 0) {
					throw new HTTPError(
						400,
						this.serviceName,
						'Cannot delete order with fired/called items',
						`/orders/${order}`
					);
				}

				// Check if any food or drink items have associated payment status
				const paidFoodItems = existingOrder.foodItems.filter(
					(item) => item.paymentStatus !== 'NONE'
				);
				const paidDrinkItems = existingOrder.drinkItems.filter(
					(item) => item.paymentStatus !== 'NONE'
				);

				if (paidFoodItems.length > 0 || paidDrinkItems.length > 0) {
					throw new HTTPError(
						400,
						this.serviceName,
						'Cannot delete order with items that have payment status',
						`/orders/${order}`
					);
				}

				// Delete all related food items associated with the order.
				await prisma.orderFoodItem.deleteMany({
					where: { orderId: order },
				});

				// Delete all related drink items associated with the order.
				await prisma.orderDrinkItem.deleteMany({
					where: { orderId: order },
				});

				// Delete the order itself.
				await prisma.order.delete({
					where: { id: order },
				});
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Prints the order items with the given IDs.
	 *
	 * This method checks if any of the specified order items have already been printed.
	 * If any items have been printed, it throws an HTTPError with a message indicating
	 * which items have already been printed. If no items have been printed, it updates
	 * the `printed` status of the specified order items to `true`.
	 *
	 * @param {number[]} ids - An array of order item IDs to be printed.
	 * @returns {Promise<string>} A promise that resolves to a string indicating the IDs of the printed items.
	 * @throws {HTTPError} If any of the specified items have already been printed.
	 */
	@InvalidateCacheByKeys((orderId: number) => [`findOrderById_[${orderId}]`])
	async printOrderItems(orderId: number, ids: number[]): Promise<string> {
		return await this.prisma.$transaction(async (prisma) => {
			try {
				const drinkItems = await prisma.orderDrinkItem.findMany({
					where: {
						id: { in: ids },
					},
					select: { id: true, printed: true },
				});

				const foodItems = await prisma.orderFoodItem.findMany({
					where: {
						id: { in: ids },
					},
					select: { id: true, printed: true, fired: true },
				});

				const allItems = [...drinkItems, ...foodItems];

				const printedItems = allItems.filter((item) => item.printed);

				if (printedItems.length !== 0) {
					throw new HTTPError(500, 'Print', 'Items have already been printed');
				}

				await prisma.orderFoodItem.updateMany({
					where: {
						id: { in: ids },
					},
					data: {
						printed: true,
					},
				});

				await prisma.orderDrinkItem.updateMany({
					where: {
						id: { in: ids },
					},
					data: {
						printed: true,
					},
				});
				return `Items have been ptinted`;
			} catch (error) {
				throw this.handleError(error);
			}
		});
	}

	/**
	 * Calls the order items by marking them as fired.
	 *
	 * @param {number[]} ids - The IDs of the order items to be called.
	 * @returns {Promise<string>} A promise that resolves to a message indicating the items have been called.
	 * @throws {HTTPError} If any of the items have not been printed or have already been fired.
	 */
	@InvalidateCacheByKeys((orderId: number) => [`findOrderById_[${orderId}]`])
	async callOrderItems(orderId: number, ids: number[]): Promise<string> {
		return this.prisma.$transaction(async (prisma) => {
			try {
				const existingOrder = await prisma.order.findUnique({
					where: { id: orderId },
					select: { id: true },
				});

				if (!existingOrder) {
					throw new HTTPError(
						404,
						'Order not found',
						`Order with ID ${orderId} not found in the database`
					);
				}

				const foodItems = await prisma.orderFoodItem.findMany({
					where: {
						id: { in: ids },
					},
					select: { id: true, printed: true, fired: true },
				});

				const drinkItems = await prisma.orderDrinkItem.findMany({
					where: {
						id: { in: ids },
					},
					select: { id: true, printed: true, fired: true },
				});

				const allItems = [...foodItems, ...drinkItems];
				const notPrintedItems = allItems.filter((item) => !item.printed);
				const firedItems = allItems.filter((item) => item.fired);

				if (notPrintedItems.length > 0) {
					throw new HTTPError(
						500,
						'Print Items',
						`Items ${notPrintedItems.map((item) => item.id).join(', ')} have not been printed.`
					);
				}

				if (firedItems.length > 0) {
					throw new HTTPError(
						500,
						'Print Items',
						`Items ${firedItems.map((item) => item.id).join(', ')} have been fired.`
					);
				}

				await prisma.orderFoodItem.updateMany({
					where: {
						id: { in: ids },
					},
					data: {
						fired: true,
					},
				});

				await prisma.orderDrinkItem.updateMany({
					where: {
						id: { in: ids },
					},
					data: {
						fired: true,
					},
				});

				return `items ${[...ids]} have been called.`;
			} catch (error) {
				throw this.handleError(error);
			}
		});
	}

	/**
	 * Updates the order items in the database for a given order ID.
	 *
	 * @param {number} orderId - The ID of the order to update.
	 * @param {Object} updatedData - The updated data for the order.
	 * @param {Prisma.OrderFoodItemCreateManyOrderInput[]} updatedData.foodItems - The updated food items for the order.
	 * @param {Prisma.OrderDrinkItemCreateManyOrderInput[]} updatedData.drinkItems - The updated drink items for the order.
	 * @param {number} updatedData.totalAmount - The updated total amount for the order.
	 * @returns {Promise<Prisma.Order>} The updated order with included server, food items, and drink items.
	 */
	@InvalidateCacheByKeys((orderId) => [`findOrderById_[${orderId}]`])
	async updateOrderItemsInDatabase(
		orderId: number,
		updatedData: {
			foodItems: Prisma.OrderFoodItemCreateManyOrderInput[];
			drinkItems: Prisma.OrderDrinkItemCreateManyOrderInput[];
			totalAmount: number;
		}
	) {
		try {
			const { foodItems, drinkItems, totalAmount } = updatedData;
			return await this.prisma.order.update({
				where: { id: orderId },
				data: {
					totalAmount,
					foodItems: {
						deleteMany: {},
						createMany: {
							data: foodItems,
						},
					},
					drinkItems: {
						deleteMany: {},
						createMany: {
							data: drinkItems,
						},
					},
				},
				include: ORDER_INCLUDE,
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Updates the food and drink items in an existing order.
	 *
	 * This method performs the following steps:
	 * 1. Finds the existing order by its ID.
	 * 2. Prepares the new order items by merging them with the existing items.
	 * 3. Updates the order items in the database within a transaction.
	 * 4. Returns the formatted updated order.
	 *
	 * @param orderId - The ID of the order to update.
	 * @param updatedData - An object containing the updated food and drink items.
	 * @returns A promise that resolves to the updated order.
	 * @throws {HTTPError} If the order is not found in the database.
	 * @throws {Error} If there is an issue during the update process.
	 */
	@InvalidateCacheByKeys((orderId) => [`findOrderById_[${orderId}]`])
	async updateItemsInOrder(
		orderId: number,
		updatedData: Pick<OrderCreateDTO, 'foodItems' | 'drinkItems'>
	) {
		try {
			return await this.prisma.$transaction(async (prisma) => {
				try {
					const existingOrder = await this.findOrderById(orderId);

					const { mergedItems, totalAmount } = await this.prepareOrderItems(
						existingOrder,
						updatedData
					);

					const formattedNewOrder: {
						foodItems: Prisma.OrderFoodItemCreateManyOrderInput[];
						drinkItems: Prisma.OrderDrinkItemCreateManyOrderInput[];
						totalAmount: number;
					} = {
						foodItems: mergedItems.foodItems,
						drinkItems: mergedItems.drinkItems,
						totalAmount,
					};

					const updatedOrder = await this.updateOrderItemsInDatabase(orderId, formattedNewOrder);
					return this.formatOrder(updatedOrder);
				} catch (error) {
					throw this.handleError(error);
				}
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Updates the properties of an existing order.
	 *
	 * @param orderId - The ID of the order to update.
	 * @param updatedProperties - An object containing the properties to update.
	 * @returns A promise that resolves to the updated order details.
	 * @throws {HTTPError} If the order is not found in the database.
	 * @throws {Error} If there is an error during the update process.
	 */
	@InvalidateCacheByKeys((orderId) => [`findOrderById_[${orderId}]`])
	async updateOrderProperties(
		orderId: number,
		updatedProperties: OrderUpdateProps
	): Promise<OrderFullSingleDTO> {
		try {
			const isCompleted =
				updatedProperties?.status === 'COMPLETED' || updatedProperties?.status === 'DISPUTED'
					? new Date()
					: null;

			const updatedOrder = await this.prisma.order.update({
				where: { id: orderId },
				data: {
					...updatedProperties,
					completionTime: isCompleted,
				},
				include: ORDER_INCLUDE,
			});

			return this.formatOrder(updatedOrder);
		} catch (error) {
			throw this.handleError(error);
		}
	}
}
