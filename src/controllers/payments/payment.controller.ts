import {
	PaymentDTO,
	PaymentSchema,
	PaymentSearchCriteria,
	PaymentSearchSchema,
	RefundDTO,
	RefundSchema,
	UserRole,
} from '@servemate/dto';
import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { TypedRequest } from '../../common/route.interface';
import { Controller, Get, Post } from '../../decorators/httpDecorators';
import { Roles } from '../../decorators/Roles';
import { Validate } from '../../middleware/validate/validate.middleware';
import { ILogger } from '../../services/logger/logger.service.interface';
import { PaymentService } from '../../services/payment/payment.service';
import { TYPES } from '../../types';
import { AbstractPaymentController } from './payment.controller.interface';

@injectable()
@Controller('/payments')
export class PaymentController extends AbstractPaymentController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.PaymentService) private paymentService: PaymentService
	) {
		super(loggerService);
	}

	/**
	 * Handles the retrieval of payments based on the provided search criteria.
	 *
	 * @param req - The request object containing the search criteria in the query parameters.
	 * @param res - The response object used to send the retrieved payments back to the client.
	 * @param next - The next middleware function in the stack, used to handle any errors that occur.
	 *
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will pass any errors encountered to the next middleware function.
	 */
	@Validate(PaymentSearchSchema, 'query')
	@Get('/')
	async getPayments(
		req: TypedRequest<{}, PaymentSearchCriteria, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const payments = await this.paymentService.findPayments(req.query);
			this.ok(res, payments);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Handles the request to retrieve a payment by its ID.
	 *
	 * @param req - The request object containing the payment ID in the parameters.
	 * @param res - The response object used to send the payment data back to the client.
	 * @param next - The next middleware function in the stack, used to pass control to the next handler in case of an error.
	 *
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will pass any errors encountered to the next middleware function.
	 *
	 * @example
	 * // Example request object
	 * const req = {
	 *   params: {
	 *     id: 'payment-id-123'
	 *   }
	 * };
	 *
	 * // Example response object
	 * const res = {
	 *   // Response methods here
	 * };
	 *
	 * // Example next function
	 * const next = (error) => {
	 *   // Error handling logic here
	 * };
	 *
	 * // Usage
	 * getPayment(req, res, next);
	 */
	@Validate(PaymentSchema.pick({ id: true }), 'params')
	@Get('/:id')
	async getPayment(
		req: TypedRequest<{ id: PaymentDTO['id'] }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const payment = await this.paymentService.findPaymentById(req.params.id);
			this.ok(res, payment);
		} catch (error) {
			next(error);
		}
	}

	@Validate(PaymentSchema.pick({ id: true }), 'params')
	@Post('/order/:id')
	/**
	 * Handles the creation of a payment.
	 *
	 * @param req - The request object containing the payment details.
	 * @param req.params.id - The ID of the entity for which the payment is being created.
	 * @param req.body.foodItems - An array of food item IDs included in the payment.
	 * @param req.body.drinkItems - An array of drink item IDs included in the payment.
	 * @param res - The response object used to send the result back to the client.
	 * @param next - The next middleware function in the stack.
	 *
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will pass any errors encountered to the next middleware function.
	 */
	async createPayment(
		req: TypedRequest<
			{ id: PaymentDTO['id'] },
			{},
			{
				foodItems: number[];
				drinkItems: number[];
			}
		>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const payment = await this.paymentService.createPayment(
				req.params.id,
				req.body.drinkItems,
				req.body.foodItems
			);
			this.ok(res, payment);
		} catch (error) {
			next(error);
		}
	}

	@Validate(PaymentSchema.pick({ id: true }), 'params')
	@Post('/complete/:id')
	async completePayment(
		req: TypedRequest<{ id: PaymentDTO['id'] }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const payment = await this.paymentService.completePayment(req.params.id);
			this.ok(res, payment);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Handles the refund of a payment.
	 *
	 * @param req - The request object containing the payment ID in the params and the refund reason in the body.
	 * @param req.params.id - The ID of the payment to be refunded.
	 * @param req.body.reason - The reason for the refund.
	 * @param res - The response object used to send the result of the refund operation.
	 * @param next - The next middleware function in the stack, used to pass errors.
	 *
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will pass any errors to the next middleware function.
	 */
	@Validate(RefundSchema, 'body')
	@Validate(PaymentSchema.pick({ id: true }), 'params')
	@Post('/refund/:id')
	@Roles([UserRole.ADMIN, UserRole.MANAGER])
	async refundPayment(
		req: TypedRequest<{ id: PaymentDTO['id'] }, {}, RefundDTO>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const paymentId = req.params.id;
			const { reason } = req.body;
			const payment = await this.paymentService.refundPayment(paymentId, reason);
			this.ok(res, payment);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Cancels a payment based on the provided payment ID.
	 *
	 * @param req - The request object containing the payment ID in the parameters.
	 * @param res - The response object used to send the response back to the client.
	 * @param next - The next middleware function in the stack.
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will pass any errors to the next middleware function.
	 *
	 * @example
	 * // Example request to cancel a payment
	 * const req = {
	 *   params: {
	 *     id: 'payment-id-123'
	 *   }
	 * };
	 * const res = {
	 *   // response object methods
	 * };
	 * const next = (error) => {
	 *   // error handling middleware
	 * };
	 *
	 * await cancelPayment(req, res, next);
	 */
	@Validate(PaymentSchema.pick({ id: true }), 'params')
	@Post('/cancel/:id')
	async cancelPayment(
		req: TypedRequest<{ id: PaymentDTO['id'] }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const payment = await this.paymentService.cancelPayment(req.params.id);
			this.ok(res, payment);
		} catch (error) {
			next(error);
		}
	}
}
