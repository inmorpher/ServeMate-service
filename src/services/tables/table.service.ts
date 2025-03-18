import { PrismaClient } from '@prisma/client';
import {
	PaymentState,
	ReservationStatus,
	TableCondition,
	TableCreate,
	TablesDTO,
	TableSearchCriteria,
	TableSeatingDTO,
	TableUpdate,
} from '@servemate/dto';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Cache, InvalidateCacheByKeys, InvalidateCacheByPrefix } from '../../decorators/Cache';
import { HTTPError } from '../../errors/http-error.class';
import { TYPES } from '../../types';
import { ITableService } from './table.service.interface';

@injectable()
export class TableService extends ITableService {
	protected serviceName = 'TableService';
	private prisma: PrismaClient;

	constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
		super();
		this.prisma = prisma;
	}
	@Cache(60)
	async findTables(criteria: TableSearchCriteria): Promise<// TablesList
	any> {
		try {
			const {
				id,
				tableNumber,
				minCapacity,
				maxCapacity,
				isOccupied,
				status,
				serverId,
				page,
				pageSize,
				sortBy,
				sortOrder,
			} = criteria;

			const where = {
				...(id !== undefined && { id: Number(id) }),
				...(tableNumber !== undefined && { tableNumber }),
				...(minCapacity !== undefined && { capacity: { gte: minCapacity } }),
				...(maxCapacity !== undefined && { capacity: { lte: maxCapacity } }),
				...(isOccupied !== undefined && { isOccupied: isOccupied as boolean }),
				...(status && { status: { equals: status.toUpperCase() as TableCondition } }),
				...(serverId !== undefined && { assignment: { some: { serverId } } }),
			};

			const [tables, total] = await Promise.all([
				this.prisma.table.findMany({
					where,
					select: {
						id: true,
						tableNumber: true,
						capacity: true,
						additionalCapacity: true,
						isOccupied: true,
						status: true,
						guests: true,
						orders: {
							where: { status: { notIn: ['CANCELED', 'COMPLETED'] } },
							select: {
								id: true,
								orderTime: true,
								status: true,
							},
						},
						assignment: {
							select: {
								server: {
									select: {
										id: true,
										name: true,
									},
								},
								isPrimary: true,
							},
						},
					},
					skip: (page - 1) * pageSize,
					take: pageSize,
					orderBy: {
						[sortBy]: sortOrder,
					},
				}),
				this.prisma.table.count({ where }),
			]);

			return {
				tables: tables.map((table) => ({
					...table,
					status: table.status as TableCondition,
				})),
				totalCount: total,
				page,
				pageSize,
				totalPages: Math.ceil(total / pageSize),
			};
		} catch (error) {
			throw this.handleError(error);
		}
	}

	@Cache(60)
	async findTableById(id: number): Promise<TablesDTO> {
		try {
			const table = await this.prisma.table.findUnique({
				where: { id },
				include: {
					orders: {
						select: {
							id: true,
							orderTime: true,
							status: true,
						},
					},
					assignment: true,
				},
			});

			if (!table) {
				throw new HTTPError(404, 'TableService', 'Table not found');
			}

			return {
				...table,
				status: table.status as TableCondition,
			};
		} catch (error) {
			throw this.handleError(error);
		}
	}

	@InvalidateCacheByPrefix('findTables')
	async createTable(table: TableCreate): Promise<{ tableNumber: number }> {
		try {
			const existingTable = await this.prisma.table.findFirst({
				where: {
					tableNumber: table.tableNumber,
				},
			});
			if (existingTable) {
				throw new HTTPError(400, 'TableService', 'Table with the same table number already exists');
			}

			const newTable = await this.prisma.table.create({
				data: {
					tableNumber: table.tableNumber,
					capacity: table.capacity,
					originalCapacity: table.capacity,
				},
			});
			return {
				tableNumber: newTable.tableNumber,
			};
		} catch (error) {
			throw this.handleError(error);
		}
	}

	@InvalidateCacheByKeys((tableId) => [`findTableById_${tableId}`])
	@InvalidateCacheByPrefix('findTables')
	async deleteTable(id: number): Promise<void> {
		try {
			await this.prisma.table.delete({
				where: { id },
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	@InvalidateCacheByKeys((tableId) => [`findTableById_${tableId}`])
	@InvalidateCacheByPrefix('findTables')
	async updateTable(id: number, table: TableUpdate): Promise<any> {
		return await this.prisma.$transaction(async (prisma) => {
			try {
				const data = {
					...(table.capacity && { capacity: table.capacity, originalCapacity: table.capacity }),
					...(table.tableNumber && { tableNumber: table.tableNumber }),
				};
				const existingTable = await prisma.table.findUnique({
					where: { id },
				});

				if (!existingTable) {
					throw new HTTPError(404, 'TableService', 'Table not found');
				}

				const updatedTable = await prisma.table.update({
					where: { id },
					data: data,
				});

				if (!updatedTable) {
					throw new HTTPError(400, 'TableService', 'Table not updated');
				}

				return updatedTable;
			} catch (error) {
				throw this.handleError(error);
			}
		});
	}

	@InvalidateCacheByKeys((tableId) => [`findTableById_${tableId}`])
	@InvalidateCacheByPrefix('findTables')
	async clearTable(id: number): Promise<string> {
		try {
			return await this.prisma.$transaction(async (prisma) => {
				const table = await prisma.table.findUnique({
					where: { id },
					include: {
						assignment: true,
						orders: {
							include: {
								payments: true,
							},
						},
					},
				});

				if (!table) {
					throw new HTTPError(404, 'TableService', 'Table not found');
				}

				const hasUnfinishedOrders =
					table.orders &&
					table.orders.some((order) => order.status !== 'COMPLETED' && order.status !== 'CANCELED');

				if (hasUnfinishedOrders) {
					throw new HTTPError(400, 'TableService', 'Table has unfinished orders');
				}

				const hasUnpaidOrders =
					table.orders &&
					table.orders.some((order) =>
						order.payments.every(
							(payment) =>
								payment.status !== PaymentState.PAID &&
								payment.status !== PaymentState.REFUNDED &&
								payment.status !== PaymentState.CANCELLED
						)
					);

				if (hasUnpaidOrders) {
					throw new HTTPError(400, 'TableService', 'Table has unpaid orders');
				}

				if (table.assignment && table.assignment.length > 0) {
					await prisma.tableAssignment.deleteMany({
						where: {
							tableId: table.id,
							isPrimary: false,
						},
					});
				}

				return `Table ${table.tableNumber} cleared successfully`;
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	@InvalidateCacheByKeys((tableId) => [`findTableById_${tableId}`])
	@InvalidateCacheByPrefix('findTables')
	async assignTables(tableIds: number[], serverId: number): Promise<void> {
		try {
			await this.prisma.$transaction(async (prisma) => {
				const server = await prisma.user.findUnique({
					where: { id: serverId },
					select: {
						id: true,
						name: true,
					},
				});

				if (!server) {
					throw new HTTPError(404, 'TableService', 'Server not found');
				}

				await prisma.tableAssignment.deleteMany({
					where: {
						serverId: serverId,
					},
				});

				const tables = await prisma.table.findMany({
					where: { id: { in: tableIds } },
					include: {
						assignment: true,
					},
				});

				if (tables.length !== tableIds.length) {
					throw new HTTPError(404, 'TableService', `One or more tables are not found.`);
				}

				await prisma.tableAssignment.createMany({
					data: tables.map((t) => ({
						tableId: t.id,
						serverId: serverId,
						isPrimary: true,
					})),
				});
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}

	@InvalidateCacheByKeys((tableId) => [`findTableById_${tableId}`])
	@InvalidateCacheByPrefix('findTables')
	async seatGuests(tableId: number, seatingData: TableSeatingDTO) {
		try {
			return await this.prisma.$transaction(async (prisma) => {
				// Find the table
				const table = await prisma.table.findUnique({
					where: { id: tableId },
					include: {
						reservations: true,
					},
				});

				// Check if the table exists
				if (!table) {
					throw new HTTPError(404, 'TableService', 'Table not found');
				}

				// Check if the table is occupied or not available
				if (table.isOccupied || table.status !== TableCondition.AVAILABLE) {
					throw new HTTPError(400, 'TableService', 'Table is not available now');
				}

				// Check seating type is RESERVATION
				if (seatingData.SeatingType === 'RESERVATION') {
					const reservation = await prisma.reservation.findUnique({
						where: { id: seatingData.reservationId },
					});

					// Check if the reservation exists
					if (!reservation) {
						throw new HTTPError(404, 'TableService', 'Reservation not found');
					}

					// Check if the reservation is already seated
					if (reservation.status === ReservationStatus.CONFIRMED) {
						throw new HTTPError(400, 'TableService', 'Reservation already seated');
					}

					// Connect reservation to the table
					await prisma.reservation.update({
						where: { id: seatingData.reservationId },
						data: {
							status: ReservationStatus.CONFIRMED,
							tables: {
								connect: {
									id: tableId,
								},
							},
						},
					});
				}

				// Update the table status
				await prisma.table.update({
					where: { id: tableId },
					data: {
						status: TableCondition.OCCUPIED,
						isOccupied: true,
						guests: seatingData.guests,
					},
				});
			});
		} catch (error) {
			throw this.handleError(error);
		}
	}
}
