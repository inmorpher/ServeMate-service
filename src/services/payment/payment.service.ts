import { trace } from '@opentelemetry/api';
import { Prisma, PrismaClient } from '@prisma/client';
import {
	OrderState,
	PaymentDTO,
	PaymentListDTO,
	PaymentSearchCriteria,
	PaymentState,
	RefundState,
} from '@servemate/dto';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Cache, InvalidateCacheByKeys, InvalidateCacheByPrefix } from '../../decorators/Cache';
import { HTTPError } from '../../errors/http-error.class';
import { TYPES } from '../../types';
import { AbstractPaymentService } from './abstract-payment.service';

@injectable()
export class PaymentService extends AbstractPaymentService {
	private tracer = trace.getTracer('payment-service');
	protected serviceName = 'PaymentService';
	private prisma: PrismaClient;

	constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
		super();
		this.prisma = prisma;
	}

	/**
	 * Finds payments based on the provided search criteria.
	 *
	 * @param {PaymentSearchCriteria} criteria - The criteria to search payments by.
	 * @param {number} criteria.page - The page number to retrieve.
	 * @param {number} criteria.pageSize - The number of payments per page.
	 * @param {string} criteria.sortBy - The field to sort the payments by.
	 * @param {'asc' | 'desc'} criteria.sortOrder - The order to sort the payments in.
	 *
	 * @returns {Promise<PaymentListDTO>} A promise that resolves to an object containing:
	 * - `payments`: An array of payments that match the search criteria.
	 * - `totalCount`: The total number of payments that match the search criteria.
	 * - `page`: The current page number.
	 * - `pageSize`: The number of payments per page.
	 * - `totalPages`: The total number of pages.
	 *
	 * @throws Will throw an error if the payment retrieval fails.
	 */
	@Cache(60)
	async findPayments(criteria: PaymentSearchCriteria): Promise<PaymentListDTO> {
		const where = this.buildWhere<PaymentSearchCriteria, Prisma.PaymentWhereInput>(criteria);
		const { page, pageSize, sortBy, sortOrder } = criteria;
		try {
			const [payments, totalCount] = await Promise.all([
				this.prisma.payment.findMany({
					where,
					skip: (criteria.page - 1) * criteria.pageSize,
					take: criteria.pageSize,
					orderBy: {
						[sortBy]: sortOrder,
					},
				}),
				this.prisma.payment.count({
					where,
				}),
			]);

			return {
				payments,
				totalCount,
				page,
				pageSize,
				totalPages: Math.ceil(totalCount / pageSize),
			};
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Finds a payment by its ID.
	 *
	 * @param {number} paymentId - The ID of the payment to find.
	 * @returns {Promise<PaymentDTO>} A promise that resolves to the payment data transfer object (DTO).
	 * @throws {HTTPError} Throws a 404 HTTP error if the payment is not found.
	 * @throws {Error} Throws an error if there is an issue with the database query or any other unexpected error.
	 */
	@Cache(60)
	async findPaymentById(paymentId: number): Promise<PaymentDTO> {
		try {
			const payment = await this.prisma.payment.findUnique({
				where: {
					id: paymentId,
				},
			});

			if (!payment) {
				throw new HTTPError(404, 'Payment ', 'Payment not found');
			}

			return payment;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Creates a payment for a given order.
	 *
	 * @param {number} orderId - The ID of the order for which the payment is being created.
	 * @param {number[]} orderDrinkItems - An array of IDs representing the drink items in the order.
	 * @param {number[]} orderFoodItems - An array of IDs representing the food items in the order.
	 * @returns {Promise<string>} A promise that resolves to a success message indicating the payment was created successfully.
	 *
	 * @throws {HTTPError} Throws an error if the order is not found.
	 * @throws {HTTPError} Throws an error if the order is already completed.
	 * @throws {HTTPError} Throws an error if the payment creation fails.
	 * @throws {HTTPError} Throws an error if updating the order items' payment status fails.
	 *
	 * @example
	 * ```typescript
	 * const orderId = 1;
	 * const orderDrinkItems = [101, 102];
	 * const orderFoodItems = [201, 202];
	 *
	 * try {
	 *   const result = await createPayment(orderId, orderDrinkItems, orderFoodItems);
	 *   console.log(result); // Payment for order 1 created successfully
	 * } catch (error) {
	 *   console.error(error.message);
	 * }
	 * ```
	 */
	@InvalidateCacheByPrefix('findPayments_')
	@InvalidateCacheByKeys((payment) => [`findPaymentById_${payment.id}`])
	async createPayment(
		orderId: number,
		orderDrinkItems: number[],
		orderFoodItems: number[]
	): Promise<string> {
		try {
			return await this.prisma.$transaction(async (prisma) => {
				const order = await prisma.order.findUnique({
					where: {
						id: orderId,
					},
					select: {
						id: true,
						status: true,
						foodItems: true,
						drinkItems: true,
					},
				});

				// Check if order exists
				if (!order) {
					throw new HTTPError(404, 'Payment ', 'Order not found');
				}
				// Check if order is already completed
				if (order.status === OrderState.COMPLETED) {
					throw new HTTPError(400, 'Payment ', 'Order already completed');
				}

				const { selectedDrinks, selectedFoods } = this.validateItems(
					orderDrinkItems,
					orderFoodItems,
					order
				);

				const subtotal = this.calculatePaymentAmount([...selectedDrinks, ...selectedFoods]);
				const { tax, serviceCharge, total } = this.calculateTaxAndCharges(subtotal);

				const payment = await prisma.payment.create({
					data: {
						amount: subtotal,
						tip: 0,
						tax,
						serviceCharge,
						totalAmount: total,
						status: PaymentState.PENDING,
						order: {
							connect: {
								id: orderId,
							},
						},
						orderDrinkItems: {
							connect: selectedDrinks.map((item) => ({
								id: item.id,
							})),
						},
						orderFoodItems: {
							connect: selectedFoods.map((item) => ({
								id: item.id,
							})),
						},
					},
				});

				if (!payment) {
					throw new HTTPError(400, 'Payment ', 'Payment creation failed');
				}

				// Only update items if there are any selected
				if (selectedFoods.length > 0 || selectedDrinks.length > 0) {
					const [updatedFoods, updatedDrinks] = await Promise.all([
						selectedFoods.length > 0
							? prisma.orderFoodItem.updateMany({
									where: {
										id: {
											in: selectedFoods.map((item) => item.id),
										},
									},
									data: {
										paymentStatus: PaymentState.PENDING,
									},
							  })
							: { count: 0 },
						selectedDrinks.length > 0
							? prisma.orderDrinkItem.updateMany({
									where: {
										id: {
											in: selectedDrinks.map((item) => item.id),
										},
									},
									data: {
										paymentStatus: PaymentState.PENDING,
									},
							  })
							: { count: 0 },
					]);

					if (
						(selectedFoods.length > 0 && updatedFoods.count === 0) ||
						(selectedDrinks.length > 0 && updatedDrinks.count === 0)
					) {
						throw new HTTPError(400, 'Payment ', 'Failed to update order items status');
					}
				}

				return `Payment for order ${order.id} created successfully`;
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Completes the payment process for a given payment ID.
	 *
	 * This method performs the following steps:
	 * 1. Retrieves the existing payment and associated order details from the database.
	 * 2. Validates the existence of the payment and order.
	 * 3. Checks if the order is already completed or if the payment is not pending.
	 * 4. Updates the payment status to "PAID" and sets the completion date.
	 * 5. Updates the payment status of associated food and drink items to "PAID".
	 * 6. Checks if the entire order is fully paid.
	 * 7. If the order is fully paid, updates the order status to "COMPLETED".
	 *
	 * @param {number} paymentId - The ID of the payment to complete.
	 * @returns {Promise<string>} A promise that resolves to a success message indicating the payment completion.
	 * @throws {HTTPError} Throws an HTTPError if the payment or order is not found, if the order is already completed, or if the payment completion fails.
	 */
	@InvalidateCacheByPrefix('findPayments_')
	@InvalidateCacheByKeys((payment) => [`findPaymentById_${payment.id}`])
	async completePayment(paymentId: number): Promise<string> {
		try {
			return await this.prisma.$transaction(async (prisma) => {
				const existingPayment = await prisma.payment.findFirst({
					where: {
						id: paymentId,
					},
					select: {
						id: true,
						orderId: true,
						status: true,
						orderFoodItems: true,
						orderDrinkItems: true,
						order: true,
					},
				});

				if (!existingPayment) {
					throw new HTTPError(404, 'Payment ', 'Payment not found');
				}

				if (!existingPayment.order) {
					throw new HTTPError(404, 'Payment ', 'Order not found');
				}

				if (
					existingPayment.order.status === OrderState.COMPLETED ||
					existingPayment.status !== PaymentState.PENDING
				) {
					throw new HTTPError(400, 'Payment ', 'Order already completed');
				}

				const [payment, foodItems, drinkItems] = await Promise.all([
					prisma.payment.update({
						where: {
							id: existingPayment.id,
						},
						data: {
							status: PaymentState.PAID,
							completedAt: new Date(),
						},
					}),

					prisma.orderFoodItem.updateMany({
						where: {
							id: {
								in: existingPayment.orderFoodItems.map((item) => item.id),
							},
						},
						data: {
							paymentStatus: PaymentState.PAID,
						},
					}),
					prisma.orderDrinkItem.updateMany({
						where: {
							id: {
								in: existingPayment.orderDrinkItems.map((item) => item.id),
							},
						},
						data: {
							paymentStatus: PaymentState.PAID,
						},
					}),
				]);

				if (!payment || !foodItems || !drinkItems) {
					throw new HTTPError(400, 'Payment ', 'Payment completion failed');
				}

				const isOrderFullyPaid = await this.checkOrderPaymentCompletion(existingPayment.orderId);

				if (isOrderFullyPaid) {
					await prisma.order.update({
						where: {
							id: existingPayment.orderId,
						},
						data: {
							status: OrderState.COMPLETED,
						},
					});
				}

				return `Payment #${payment.id} completed successfully`;
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Refunds a payment by its ID and updates the related order and items' statuses.
	 *
	 * @param {number} paymentId - The ID of the payment to be refunded.
	 * @param {string} reason - The reason for the refund.
	 * @returns {Promise<string>} - A promise that resolves to a success message upon successful refund.
	 * @throws {HTTPError} - Throws an HTTPError if the payment is not found, already refunded, or cancelled.
	 *
	 * This method performs the following steps:
	 * 1. Retrieves the payment details by its ID.
	 * 2. Checks if the payment exists.
	 * 3. Checks if the payment is already refunded or cancelled.
	 * 4. Creates a refund record in the database.
	 * 5. Updates the payment status to 'REFUNDED'.
	 * 6. Updates the payment status of related order food and drink items to 'REFUNDED'.
	 * 7. Updates the order status to 'READY_TO_PAY'.
	 *
	 * The method uses a database transaction to ensure all operations are atomic.
	 */
	@InvalidateCacheByPrefix('findPayments_')
	@InvalidateCacheByKeys((payment) => [`findPaymentById_${payment.id}`])
	async refundPayment(paymentId: number, reason: string): Promise<string> {
		try {
			return await this.prisma.$transaction(async (prisma) => {
				if (!reason || reason.trim().length === 0) {
					throw new HTTPError(400, 'Payment ', 'Refund reason cannot be empty');
				}

				const payment = await prisma.payment.findUnique({
					where: {
						id: paymentId,
					},
					select: {
						id: true,
						orderId: true,
						amount: true,
						status: true,
						orderDrinkItems: true,
						orderFoodItems: true,
					},
				});

				// Check if payment exists
				if (!payment) {
					throw new HTTPError(404, 'Payment ', 'Payment not found');
				}

				// Check if payment is already refunded
				if (payment.status === PaymentState.REFUNDED) {
					throw new HTTPError(400, 'Payment ', 'Payment already refunded');
				}

				// Check if payment is already cancelled
				if (payment.status === PaymentState.CANCELLED) {
					throw new HTTPError(
						400,
						'Payment ',
						'Payment is already cancelled and cannot be refunded'
					);
				}

				await Promise.all([
					prisma.refundPayment.create({
						data: {
							paymentId,
							reason,
							amount: payment.amount || 0,
							createdAt: new Date(),
							status: RefundState.COMPLETED,
						},
					}),
					prisma.payment.update({
						where: {
							id: paymentId,
						},
						data: {
							status: PaymentState.REFUNDED,
						},
					}),
					prisma.orderFoodItem.updateMany({
						where: {
							id: {
								in: payment.orderFoodItems.map((item) => item.id),
							},
						},
						data: {
							paymentStatus: PaymentState.REFUNDED,
						},
					}),
					prisma.orderDrinkItem.updateMany({
						where: {
							id: {
								in: payment.orderDrinkItems.map((item) => item.id),
							},
						},
						data: {
							paymentStatus: PaymentState.REFUNDED,
						},
					}),
					prisma.order.update({
						where: {
							id: payment.orderId,
						},
						data: {
							status: OrderState.READY_TO_PAY,
						},
					}),
				]);

				return `Payment ${payment.id} refunded successfully`;
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Cancels a payment by its ID and updates the related order and items' statuses.
	 *
	 * @param {number} paymentId - The ID of the payment to be cancelled.
	 * @returns {Promise<string>} - A promise that resolves to a success message upon successful cancellation.
	 * @throws {HTTPError} - Throws an HTTPError if the payment is not found, already cancelled, or refunded.
	 *
	 * This method performs the following steps:
	 * 1. Retrieves the payment details by its ID.
	 * 2. Checks if the payment exists.
	 * 3. Checks if the payment is already cancelled.
	 * 4. Checks if the payment is already refunded.
	 * 5. Updates the payment status to 'CANCELLED'.
	 * 6. Updates the payment status of related order food and drink items to 'CANCELLED'.
	 * 7. Updates the order status to 'READY_TO_PAY'.
	 *
	 * The method uses a database transaction to ensure all operations are atomic.
	 */
	@InvalidateCacheByPrefix('findPayments_')
	@InvalidateCacheByKeys((payment) => [`findPaymentById_${payment.id}`])
	async cancelPayment(paymentId: number): Promise<string> {
		try {
			return await this.prisma.$transaction(async (prisma) => {
				const payment = await prisma.payment.findUnique({
					where: {
						id: paymentId,
					},
					select: {
						id: true,
						status: true,
						orderId: true,
						orderDrinkItems: {
							select: {
								id: true,
							},
						},
						orderFoodItems: {
							select: {
								id: true,
							},
						},
					},
				});

				// Check if payment exists
				if (!payment) {
					throw new HTTPError(404, 'Payment ', 'Payment not found');
				}

				// Check if payment is already cancelled
				if (payment.status === PaymentState.CANCELLED) {
					throw new HTTPError(400, 'Payment ', 'Payment already cancelled');
				}

				// Check if payment is already refunded
				if (payment.status === PaymentState.REFUNDED) {
					throw new HTTPError(
						400,
						'Payment ',
						'Payment is already refunded and cannot be cancelled'
					);
				}

				// Check if payment is already paid
				if (payment.status === PaymentState.PAID) {
					throw new HTTPError(
						400,
						'Payment ',
						'Payment is already paid and cannot be cancelled use refund instead'
					);
				}

				// Updating all connected order items to 'CANCELLED' status
				const [cancelledPayment, updatedFoods, updatedDrinks, order] = await Promise.all([
					prisma.payment.update({
						where: {
							id: paymentId,
						},
						data: {
							status: PaymentState.CANCELLED,
						},
					}),
					prisma.orderFoodItem.updateMany({
						where: {
							id: {
								in: payment.orderFoodItems.map((item) => item.id),
							},
						},
						data: {
							paymentStatus: PaymentState.CANCELLED,
						},
					}),
					prisma.orderDrinkItem.updateMany({
						where: {
							id: {
								in: payment.orderDrinkItems.map((item) => item.id),
							},
						},
						data: {
							paymentStatus: PaymentState.CANCELLED,
						},
					}),
					prisma.order.update({
						where: {
							id: payment.orderId,
						},
						data: {
							status: OrderState.READY_TO_PAY,
						},
					}),
				]);

				if (!cancelledPayment || !updatedFoods || !updatedDrinks || !order) {
					throw new HTTPError(400, 'Payment ', 'Payment cancellation failed');
				}

				return `Payment ${payment.id} cancelled successfully`;
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Validates the provided drink and food items against the order items.
	 *
	 * @param {number[]} orderDrinkItems - An array of drink item IDs.
	 * @param {number[]} orderFoodItems - An array of food item IDs.
	 * @param {Prisma.Order} order - The order object containing the food and drink items.
	 * @returns {Object} An object containing the selected food and drink items.
	 * @throws {HTTPError} Throws an error if the provided drink or food items do not match the order items.
	 */
	private async checkOrderPaymentCompletion(orderId: number): Promise<boolean> {
		try {
			const orderItems = await this.prisma.order.findUnique({
				where: {
					id: orderId,
				},
				select: {
					foodItems: {
						select: {
							paymentStatus: true,
						},
					},
					drinkItems: {
						select: {
							paymentStatus: true,
						},
					},
				},
			});

			if (!orderItems) {
				throw new HTTPError(404, 'Payment', 'Order not found');
			}

			const allFoodItemsPaid = orderItems.foodItems.every(
				(item) => item.paymentStatus === PaymentState.PAID
			);
			const allDrinkItemsPaid = orderItems.drinkItems.every(
				(item) => item.paymentStatus === PaymentState.PAID
			);

			return allFoodItemsPaid && allDrinkItemsPaid;
		} catch (error) {
			throw this.handleError(error);
		}
	}
}
