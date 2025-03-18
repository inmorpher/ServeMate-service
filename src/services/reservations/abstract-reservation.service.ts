import { Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { ListReturnType, ReservationStatus } from '../../../dto-package/src';
import {
	CreateReservationDTO,
	ReservationConflictDTO,
	ReservationDetailedDTO,
	ReservationGuestInfo,
	ReservationId,
	ReservationSearchCriteriaDTO,
	ReservationWithTablesDTO,
	UpdateReservationDTO,
} from '../../../dto-package/src/dto/reservation.dto';
import { BaseService, PrismaTransaction } from '../../common/base.service';
import { HTTPError } from '../../errors/http-error.class';
import { TYPES } from '../../types';

@injectable()
export abstract class AbstractReservationService extends BaseService {
	protected serviceName = 'AbstractReservationService';

	constructor(@inject(TYPES.PrismaClient) protected prisma: PrismaClient) {
		super();
	}

	// Create a reservation
	abstract createReservation(reservation: CreateReservationDTO): Promise<ReservationDetailedDTO>;
	// Get Reservation by ID
	abstract getReservationById(id: number): Promise<ReservationWithTablesDTO>;
	// Get Reservations by criteria
	abstract getReservationsByCriteria(
		criteria: ReservationSearchCriteriaDTO
	): Promise<ListReturnType<ReservationWithTablesDTO>>;
	// Update Reservation by ID
	abstract updateReservation(
		reservationId: number,
		reservation: CreateReservationDTO
	): Promise<ReservationDetailedDTO>;
	//Update Reservation status by ID
	abstract updateReservationStatus(
		reservationId: number,
		status: ReservationStatus
	): Promise<ReservationDetailedDTO>;
	// Update Reservation time by ID
	abstract updateReservationTime(
		reservationId: number,
		time: Date
	): Promise<ReservationDetailedDTO>;
	// Update Reservation tables by ID
	abstract updateReservationTables(
		reservationId: number,
		tables: number[]
	): Promise<ReservationDetailedDTO>;
	//Update Reservation guests info by ID
	abstract updateReservationGuestInfo(
		reservationId: number,
		guestsInfo: ReservationGuestInfo
	): Promise<ReservationDetailedDTO>;
	// Update Reservation Comments by ID
	abstract updateReservationComment(
		reservationId: number,
		comments: string
	): Promise<ReservationDetailedDTO>;
	// Delete Reservation by ID
	abstract deleteReservation(reservationId: number): Promise<void>;

	/**
	 * Builds a Prisma search criteria object for reservations based on the provided criteria.
	 *
	 * @param {ReservationSearchCriteriaDTO} criteria - The search criteria for reservations.
	 * @returns {Prisma.ReservationWhereInput} The Prisma search criteria object.
	 *
	 * The search criteria can include the following fields:
	 * - `name` (optional): Filters reservations by name, case insensitive.
	 * - `email` (optional): Filters reservations by email, case insensitive.
	 * - `phone` (optional): Filters reservations by phone, case insensitive.
	 * - `status` (optional): Filters reservations by status.
	 * - `guestsCount` (optional): Filters reservations by the exact number of guests.
	 * - `allergies` (optional): Filters reservations that have any of the specified allergies.
	 * - `guestsCountMin` (optional): Filters reservations with a minimum number of guests.
	 * - `guestsCountMax` (optional): Filters reservations with a maximum number of guests.
	 * - `timeStart` (optional): Filters reservations with a start time greater than or equal to the specified time.
	 * - `timeEnd` (optional): Filters reservations with an end time less than or equal to the specified time.
	 * - `tables` (optional): Filters reservations that include any of the specified table IDs.
	 */
	protected buildSearchCriteria(
		criteria: ReservationSearchCriteriaDTO
	): Prisma.ReservationWhereInput {
		return {
			...(criteria.name && { name: { contains: criteria.name, mode: 'insensitive' } }),
			...(criteria.email && { email: { contains: criteria.email, mode: 'insensitive' } }),
			...(criteria.phone && { phone: { contains: criteria.phone, mode: 'insensitive' } }),
			...(criteria.status && { status: { equals: criteria.status } }),
			...(criteria.guestsCount && { guestsCount: { equals: criteria.guestsCount } }),

			...((criteria.guestsCountMin || criteria.guestsCountMax) && {
				guestsCount: {
					...(criteria.guestsCountMin && { gte: criteria.guestsCountMin }),
					...(criteria.guestsCountMax && { lte: criteria.guestsCountMax }),
				},
			}),

			...((criteria.timeStart || criteria.timeEnd) && {
				time: {
					...(criteria.timeStart && { gte: criteria.timeStart }),
					...(criteria.timeEnd && { lte: criteria.timeEnd }),
				},
			}),

			...(criteria.tables &&
				criteria.tables.length > 0 && {
					tables: {
						some: {
							id: {
								in: criteria.tables,
							},
						},
					},
				}),

			...(criteria.allergies &&
				criteria.allergies.length > 0 && {
					allergies: {
						hasSome: criteria.allergies,
					},
				}),
		};
	}

	/**
	 * Validates the provided reservation tables.
	 *
	 * @param tables - An array of table IDs to validate.
	 * @param prisma - The Prisma transaction object for database operations.
	 * @throws Will throw an error if any of the tables do not exist.
	 */
	protected async validateReservationTables(
		tables: ReservationId[],
		prisma: PrismaTransaction
	): Promise<void> {
		if (!tables || tables.length === 0) {
			return;
		}
		// Get all table matching the ids
		const existingTables = await prisma.table.findMany({
			where: {
				id: {
					in: tables,
				},
			},
			select: {
				id: true,
				tableNumber: true,
				capacity: true,
				status: true,
			},
		});

		// Check if all tables exist
		if (existingTables.length !== tables.length) {
			throw new HTTPError(400, 'Reservation service', 'Tables not found');
		}
	}

	/**
	 * Checks for time conflicts with existing reservations.
	 *
	 * @param tableIds - An array of table IDs to check for conflicts.
	 * @param startTime - The start time of the reservation.
	 * @param reservationId - The ID of the reservation to exclude from the conflict check (optional).
	 * @returns A promise that resolves to an array of conflicting reservations.
	 */
	protected async checkTimeConflicts(
		tableIds: ReservationId[],
		startTime: Date,
		reservationId: number | undefined = undefined,
		prisma: PrismaTransaction = this.prisma
	): Promise<ReservationConflictDTO[]> {
		const reservationDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
		const reservationEnd = new Date(startTime.getTime() + reservationDuration); // Calculate end time
		if (!tableIds || tableIds.length === 0) {
			return [];
		}
		// Check for conflicting reservations
		const conflictingReservations = await prisma.reservation.findMany({
			where: {
				...(reservationId !== undefined ? { id: { not: reservationId } } : {}),
				tables: {
					some: {
						id: {
							in: tableIds,
						},
					},
				},
				isActive: true,
				AND: [
					{ time: { lt: reservationEnd } },
					{
						OR: [
							{ time: { gte: startTime } },
							{
								time: {
									lt: startTime,
									gte: reservationEnd,
								},
							},
						],
					},
				],
			},
			select: {
				id: true,
				tables: {
					select: {
						id: true,
						tableNumber: true,
					},
				},
				time: true,
			},
		});

		const result = conflictingReservations.flatMap((reservation) => ({
			reservationId: reservation.id,
			time: reservation.time,
			tables: reservation.tables,
		}));

		return result;
	}

	/**
	 * Updates a reservation with the provided data and optionally checks for time conflicts.
	 *
	 * @param reservationId - The ID of the reservation to update.
	 * @param data - The data to update the reservation with.
	 * @param checkConflicts - Whether to check for time conflicts with other reservations (default: false).
	 * @returns promise that resolves to the updated reservation details, including any conflicts.
	 * @throws Will throw an error if the update operation fails.
	 */
	protected async performUpdate(
		reservationId: number,
		data: UpdateReservationDTO,
		checkConflicts: boolean = false
	): Promise<ReservationDetailedDTO> {
		try {
			return this.prisma.$transaction(async (prisma) => {
				// Check if tables are provided and validate them
				const updatedReservation = await prisma.reservation.update({
					where: {
						id: reservationId,
					},
					// Update the reservation with the new tables
					data: {
						// Exclude tables from the data object
						...(({ tables, ...rest }) => rest)(data),
						// If tables are provided, set them
						...(data.tables !== undefined
							? { tables: { set: data.tables.map((tableId) => ({ id: tableId })) } }
							: {}),
					},
					// Include the tables in the response
					include: {
						tables: {
							select: {
								id: true,
								tableNumber: true,
							},
						},
					},
				});

				// Initialize conflict as an empty array
				let conflict: ReservationConflictDTO[] = [];

				// If tables are provided, validate them and check for conflicts
				if (checkConflicts && data.tables) {
					conflict = await this.checkTimeConflicts(
						updatedReservation.tables.map((table) => table.id),
						updatedReservation.time,
						updatedReservation.id,
						prisma
					);
				}

				// Return the updated reservation and any conflicts
				return {
					reservation: updatedReservation,
					conflict,
				};
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}
}
