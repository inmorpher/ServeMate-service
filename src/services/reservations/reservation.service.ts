import { PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Cache, InvalidateCacheByKeys, InvalidateCacheByPrefix } from '../../decorators/Cache';
import {
	CreateReservationDTO,
	ListReturnType,
	ReservationDetailedDTO,
	ReservationGuestInfo,
	ReservationSearchCriteriaDTO,
	ReservationStatus,
	ReservationWithTablesDTO,
	UpdateReservationDTO
} from '../../dto-package';
import { HTTPError } from '../../errors/http-error.class';
import { TYPES } from '../../types';
import { AbstractReservationService } from './abstract-reservation.service';

@injectable()
export class ReservationService extends AbstractReservationService {
	protected serviceName = 'ReservationService';
	constructor(@inject(TYPES.PrismaClient) protected prisma: PrismaClient) {
		super(prisma);
		this.prisma = prisma;
	}

	async createReservation(reservation: CreateReservationDTO): Promise<ReservationDetailedDTO> {
		try {
			return this.prisma.$transaction(async (prisma) => {
				// Check if tables are provided and validate them
				await this.validateReservationTables(reservation.tables, prisma);
				// Check if tables are available, if not it will show a warning with response
				const conflict = await this.checkTimeConflicts(reservation.tables, reservation.time, undefined, prisma);
				// If there are conflicts, throw an error
				const { tables, ...reservationData } = reservation;

				const newReservation = await prisma.reservation.create({
					data: {
						...reservationData,
						reservationTables: {
							create: tables.map((tableId) => ({
								table: {
									connect: { id: tableId },
								},
							})),
						},
					},
					include: {
						reservationTables: {
							select: {
								id: true,
								tableNumber: true,
							},
						},
					},
});

return {
  reservation: {
    ...newReservation,
    tables: newReservation.reservationTables,
  },
  conflict,
};
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Retrieves a reservation by its ID.
	 *
	 * @param id - The unique identifier of the reservation to retrieve.
	 * @returns A promise that resolves to a detailed DTO of the reservation, including associated tables.
	 *
	 * @see {@link ReservationWithTablesDTO}
	 *
	 * @throws Will throw an error if the reservation is not found.
	 */
	@Cache(60)
	async getReservationById(id: number): Promise<ReservationWithTablesDTO> {
		try {
			// Check if reservation exists
			const reservation = await this.prisma.reservation.findUnique({
				where: {
					id: id,
				},
				include: {
					reservationTables: {
						select: {
							id: true,
							tableNumber: true,
						},
					},
				},
			});

			// If not, throw an error
			if (!reservation) {
				throw new HTTPError(404, 'Reservation service', 'Reservation not found');
			}

			return {
				...reservation,
				tables: reservation.reservationTables,
			};
		} catch (error) {
			throw this.handleError(error);
		}
	}
	@Cache(60)
	async getReservationsByCriteria(
		criteria: ReservationSearchCriteriaDTO
	): Promise<ListReturnType<ReservationWithTablesDTO>> {
		try {
			const where = this.buildSearchCriteria(criteria);
			const { page, pageSize, sortOrder, sortBy } = criteria;

			const [reservations, totalCount] = await Promise.all([
				this.prisma.reservation.findMany({
					where,
					include: {
						reservationTables: {
							select: {
								id: true,
								tableNumber: true,
							},
						},
					},
					skip: (page - 1) * pageSize,
					take: pageSize,
					orderBy: {
						[sortBy]: sortOrder,
					},
				}),
				this.prisma.reservation.count({ where }),
			]);

			return {
				list: reservations.map((reservation) => ({
					...reservation,
					tables: reservation.reservationTables,
				})),
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
	 * Updates an existing reservation with the provided data.
	 *
	 * @param id - The unique identifier of the reservation to update.
	 * @param reservation - The updated reservation data.
	 * @returns A promise that resolves to a detailed DTO of the updated reservation.
	 *
	 * @see {@link ReservationDetailedDTO}
	 *
	 * @throws Will throw an error if the reservation is not found or if the update fails.
	 */
	@InvalidateCacheByKeys((reservationID) => [`getReservationById_[${reservationID}]`])
	@InvalidateCacheByPrefix('getReservationsByCriteria')
	@Cache(60, (reservationId) => `getReservationById_[${reservationId}]`)
	async updateReservation(
		id: number,
		reservation: UpdateReservationDTO
	): Promise<ReservationDetailedDTO> {
		return this.performUpdate(
			id,
			reservation,
			reservation.tables !== undefined && reservation.tables.length > 0
		);
	}

	/**
	 * Updates the status of a reservation.
	 *
	 * @param reservationId - The unique identifier of the reservation to update
	 * @param status - The new status to set for the reservation
	 *
	 * @see {@link ReservationStatus}
	 *
	 * @returns A promise that resolves to the detailed reservation data after update
	 *
	 * @remarks
	 * This method automatically sets the `isActive` field to `false` when the status is
	 * either `CANCELLED` or `NO_SHOW`, and `true` for all other status values.
	 */
	@InvalidateCacheByKeys((reservationID) => [`getReservationById_[${reservationID}]`])
	@InvalidateCacheByPrefix('getReservationsByCriteria')
	@Cache(60, (reservationId) => `getReservationById_[${reservationId}]`)
	async updateReservationStatus(
		reservationId: number,
		status: ReservationStatus
	): Promise<ReservationDetailedDTO> {
		return this.performUpdate(reservationId, {
			status,
			isActive: status !== ReservationStatus.CANCELLED && status !== ReservationStatus.NO_SHOW,
		});
	}

	/**
	 * Updates the time of an existing reservation.
	 *
	 * @param reservationId - The unique identifier of the reservation to update.
	 * @param time - The new time to set for the reservation.
	 * @returns A promise that resolves to a detailed DTO of the updated reservation.
	 *
	 * @see {@link ReservationDetailedDTO}
	 *
	 * @throws Will throw an error if the reservation is not found or if the update fails.
	 */
	@InvalidateCacheByKeys((reservationID) => [`getReservationById_[${reservationID}]`])
	@InvalidateCacheByPrefix('getReservationsByCriteria')
	@Cache(60, (reservationId) => `getReservationById_[${reservationId}]`)
	async updateReservationTime(reservationId: number, time: Date): Promise<ReservationDetailedDTO> {
		return this.performUpdate(reservationId, { time }, true);
	}

	/**
	 * Updates the tables associated with a reservation.
	 *
	 * @param reservationId - The unique identifier of the reservation to update.
	 * @param tables - An array of table IDs to associate with the reservation.
	 * @returns A promise that resolves to a detailed DTO of the updated reservation.
	 *
	 * @see {@link ReservationDetailedDTO}
	 *
	 * @throws Will throw an error if the reservation is not found or if the update fails.
	 */
	@InvalidateCacheByKeys((reservationID) => [`getReservationById_[${reservationID}]`])
	@InvalidateCacheByPrefix('getReservationsByCriteria')
	@Cache(60, (reservationId) => `getReservationById_[${reservationId}]`)
	async updateReservationTables(
		reservationId: number,
		tables: number[]
	): Promise<ReservationDetailedDTO> {
		return this.performUpdate(reservationId, { tables }, true);
	}

	/**
	 * Updates the guest information of a reservation.
	 *
	 * @param reservationId - The unique identifier of the reservation to update.
	 * @param guestInfo - An object containing the updated guest information.
	 * @see {@link ReservationGuestInfo}
	 * @returns A promise that resolves to a detailed DTO of the updated reservation.
	 *
	 * @see {@link ReservationDetailedDTO}
	 *
	 * @throws Will throw an error if the reservation is not found or if the update fails.
	 */
	@InvalidateCacheByKeys((reservationID) => [`getReservationById_[${reservationID}]`])
	@InvalidateCacheByPrefix('getReservationsByCriteria')
	@Cache(60, (reservationId) => `getReservationById_[${reservationId}]`)
	async updateReservationGuestInfo(
		reservationId: number,
		guestInfo: ReservationGuestInfo
	): Promise<ReservationDetailedDTO> {
		return this.performUpdate(reservationId, guestInfo);
	}

	/**
	 * Updates the comments of a reservation.
	 *
	 * @param reservationId - The unique identifier of the reservation to update.
	 * @param comments - The new comments to set for the reservation.
	 * @returns A promise that resolves to a detailed DTO of the updated reservation.
	 *
	 * @see {@link ReservationDetailedDTO}
	 *
	 * @throws Will throw an error if the reservation is not found or if the update fails.
	 */
	@InvalidateCacheByKeys((reservationID) => [`getReservationById_[${reservationID}]`])
	@InvalidateCacheByPrefix('getReservationsByCriteria')
	@Cache(60, (reservationId) => `getReservationById_[${reservationId}]`)
	async updateReservationComment(
		reservationId: number,
		comments: string
	): Promise<ReservationDetailedDTO> {
		return this.performUpdate(reservationId, { comments });
	}

	
	/**
	 * Deletes a reservation by its ID.
	 *
	 * @param id - The unique identifier of the reservation to delete.
	 * @returns A promise that resolves when the reservation is successfully deleted.
	 *
	 * @throws Will throw an error if the reservation is not found or if the deletion fails.
	 */

	@InvalidateCacheByKeys((reservationID) => [`getReservationById_[${reservationID}]`])
	@InvalidateCacheByPrefix('findReservations')
	async deleteReservation(id: number): Promise<void> {
		try {
			await this.prisma.reservation.delete({
				where: {
					id,
				},
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}
}
