import { Allergies } from '@servemate/dto';
import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { ReservationStatus } from '../../../dto-package/src';
import {
	CreateReservationDTO,
	CreateReservationSchema,
	ReservationDTO,
	ReservationGuestInfo,
	ReservationGuestInfoSchema,
	ReservationSchema,
	ReservationSearchCriteria,
	ReservationSearchCriteriaDTO,
	UpdateReservationDTO,
} from '../../../dto-package/src/dto/reservation.dto';
import { BaseController } from '../../common/base.controller';
import { TypedRequest } from '../../common/route.interface';
import { Controller, Delete, Get, Patch, Post, Put } from '../../decorators/httpDecorators';
import { Validate } from '../../middleware/validate/validate.middleware';
import { ILogger } from '../../services/logger/logger.service.interface';
import { ReservationService } from '../../services/reservations/reservation.service';
import { TYPES } from '../../types';

@injectable()
@Controller('/reservations')
export class ReservationController extends BaseController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.ReservationService) private reservationService: ReservationService
	) {
		super(loggerService);
	}

	@Validate(CreateReservationSchema, 'body')
	@Post('/')
	/**
	 * Creates a new reservation.
	 *
	 * This method processes a reservation creation request, attempts to create a reservation
	 * using the request body data, and sends the appropriate HTTP response based on whether the
	 * reservation was successfully returned from the service.
	 *
	 * @param req - The request object containing the reservation data.
	 * @param res - The response object used to send back the HTTP response. If a reservation is returned,
	 * it will send an "OK" response; otherwise, it will send a "Created" response.
	 * @param next - The next middleware function, to be called with an error if one occurs.
	 * @returns A promise that resolves once the reservation creation process is complete.
	 * @throws Will pass any caught errors to the next middleware for handling.
	 */
	async createReservation(
		req: TypedRequest<{}, {}, CreateReservationDTO>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const reservation = await this.reservationService.createReservation(req.body);
			reservation ? this.ok(res, reservation) : this.created(res);
		} catch (error) {
			next(error);
		}
	}

	@Validate(ReservationSchema.pick({ id: true }), 'params')
	@Get('/:id')
	/**
	 * Retrieves a reservation by its unique identifier.
	 *
	 * This method extracts the reservation ID from the request parameters,
	 * converts it to a number, and uses the reservation service to fetch the corresponding reservation.
	 * If the reservation is found, it responds with the reservation data; otherwise, it passes the error to the next middleware.
	 *
	 * @param req - The request object, where req.params.id is the unique identifier of the reservation.
	 * @param res - The response object used to send the reservation data upon success.
	 * @param next - The next middleware function to forward any encountered errors.
	 * @returns A Promise that resolves with the repository operation response.
	 *
	 * @throws An error if the reservation retrieval fails, which is then forwarded to the error handling middleware.
	 */
	async getReservationById(
		req: TypedRequest<{ id: string }, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const reservation = await this.reservationService.getReservationById(Number(req.params.id));
			this.ok(res, reservation);
		} catch (error) {
			next(error);
		}
	}

	@Validate(ReservationSearchCriteria, 'query')
	@Get('/')
	async getAllReservations(
		req: TypedRequest<{}, ReservationSearchCriteriaDTO, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const reservations = await this.reservationService.getReservationsByCriteria(req.query);
			this.ok(res, reservations);
		} catch (error) {
			next(error);
		}
	}

	@Validate(ReservationSchema.partial(), 'body')
	@Validate(ReservationSchema.pick({ id: true }), 'params')
	@Put('/:id')
	/**
	 * Updates an existing reservation with the provided data.
	 *
	 * @param req - The HTTP request object that contains:
	 *   - params: an object with the reservation ID.
	 *   - body: an object with the new reservation properties.
	 * @param res - The HTTP response object used to send the updated reservation.
	 * @param next - The next middleware function in case of errors.
	 * @returns A promise that resolves when the reservation update is completed successfully.
	 *
	 * @throws Will call next(error) if an error occurs during the update.
	 */
	async updateReservation(
		req: TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, UpdateReservationDTO>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const updatedReservation = await this.reservationService.updateReservation(
				Number(req.params.id),
				req.body
			);
			this.ok(res, updatedReservation);
		} catch (error) {
			next(error);
		}
	}

	@Validate(ReservationSchema.pick({ status: true }), 'body')
	@Validate(ReservationSchema.pick({ id: true }), 'params')
	@Patch('/:id/status')
	/**
	 * Updates the status of a reservation.
	 *
	 * @param req - The HTTP request object containing the reservation ID in the route parameters and the new status in the request body.
	 * @param res - The HTTP response object used for sending back the updated reservation details.
	 * @param next - The next middleware function to call in case of errors.
	 * @returns A promise that resolves when the reservation status has been successfully updated.
	 *
	 * @throws Propagates any errors encountered during the update process to the error handling middleware.
	 */
	async updateReservationStatus(
		req: TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, { status: ReservationStatus }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const updatedReservation = await this.reservationService.updateReservationStatus(
				Number(req.params.id),
				req.body.status
			);
			this.ok(res, updatedReservation);
		} catch (error) {
			next(error);
		}
	}

	@Validate(ReservationSchema.pick({ time: true }), 'body')
	@Validate(ReservationSchema.pick({ id: true }), 'params')
	@Patch('/:id/time')
	/**
	 * Updates the time of an existing reservation.
	 *
	 * @param req - The request object containing the reservation ID in the params and the new time in the body.
	 * @param res - The response object used to send the updated reservation.
	 * @param next - The next middleware function in the stack.
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will pass any errors to the next middleware function.
	 */
	async updateReservationTime(
		req: TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, Pick<ReservationDTO, 'time'>>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const updatedReservation = await this.reservationService.updateReservationTime(
				Number(req.params.id),
				new Date(req.body.time)
			);
			this.ok(res, updatedReservation);
		} catch (error) {
			next(error);
		}
	}

	@Validate(ReservationSchema.pick({ tables: true }), 'body')
	@Validate(ReservationSchema.pick({ id: true }), 'params')
	@Patch('/:id/tables')
	async updateReservationTables(
		req: TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, { tables: number[] }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const updatedReservation = await this.reservationService.updateReservationTables(
				Number(req.params.id),
				req.body.tables
			);
			this.ok(res, updatedReservation);
		} catch (error) {
			next(error);
		}
	}

	@Validate(ReservationGuestInfoSchema, 'body')
	@Validate(ReservationSchema.pick({ id: true }), 'params')
	@Patch('/:id/guest-info')
	async updateReservationGuestInfo(
		req: TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, { guestInfo: ReservationGuestInfo }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const updatedReservation = await this.reservationService.updateReservationGuestInfo(
				Number(req.params.id),
				req.body.guestInfo
			);
			this.ok(res, updatedReservation);
		} catch (error) {
			next(error);
		}
	}

	@Validate(ReservationSchema.pick({ comments: true }), 'body')
	@Validate(ReservationSchema.pick({ id: true }), 'params')
	@Patch('/:id/comment')
	async updateReservationComment(
		req: TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, { comments: string }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const updatedReservation = await this.reservationService.updateReservationComment(
				Number(req.params.id),
				req.body.comments
			);
			this.ok(res, updatedReservation);
		} catch (error) {
			next(error);
		}
	}

	@Validate(ReservationSchema.pick({ allergies: true }), 'body')
	@Validate(ReservationSchema.pick({ id: true }), 'params')
	@Patch('/:id/allergies')
	async updateReservationAllergies(
		req: TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, { allergies: Allergies[] }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const updatedReservation = await this.reservationService.updateReservationAllergies(
				Number(req.params.id),
				req.body.allergies
			);
			this.ok(res, updatedReservation);
		} catch (error) {
			next(error);
		}
	}

	@Validate(ReservationSchema.pick({ id: true }), 'params')
	@Delete('/:id')
	async deleteReservation(
		req: TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			await this.reservationService.deleteReservation(Number(req.params.id));
			this.ok(res, { message: 'Reservation deleted successfully' });
		} catch (error) {
			next(error);
		}
	}
}
