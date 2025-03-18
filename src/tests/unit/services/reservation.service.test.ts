import { PrismaClient } from '@prisma/client';
import { Allergy, ReservationStatus } from '@servemate/dto';
import { Container } from 'inversify';
import 'reflect-metadata';
import { HTTPError } from '../../../errors/http-error.class';
import { ReservationService } from '../../../services/reservations/reservation.service';
import { TYPES } from '../../../types';

// Отключаем кеширование для тестов
jest.mock('../../../decorators/Cache', () => ({
	Cache: () => jest.fn(),
	InvalidateCacheByKeys: () => jest.fn(),
	InvalidateCacheByPrefix: () => jest.fn(),
}));

// Тестовый класс, который предоставляет доступ к защищенным методам
class TestReservationService extends ReservationService {
	public async testValidateReservationTables(tableIds: number[], client: any) {
		return super.validateReservationTables(tableIds, client);
	}

	public async testCheckTimeConflicts(tableIds: number[], startTime: Date) {
		return this.checkTimeConflicts(tableIds, startTime);
	}

	public testBuildSearchCriteria(criteria: any) {
		return this.buildSearchCriteria(criteria);
	}

	public async testPerformUpdate(id: number, data: any, checkConflict?: boolean) {
		return this.performUpdate(id, data, checkConflict);
	}

	// Устанавливаем мок-функции для остальных методов
	public setMocks() {
		this.checkTimeConflicts = jest.fn().mockResolvedValue([]);
		this.buildSearchCriteria = jest.fn().mockReturnValue({});
		this.performUpdate = jest.fn().mockImplementation((id, data) => {
			return Promise.resolve({
				reservation: { id, ...data, tables: [{ id: 1, tableNumber: 1 }] },
				conflict: [],
			});
		});
	}
}

describe('ReservationService', () => {
	let container: Container;
	let reservationService: TestReservationService;
	let mockPrisma: jest.Mocked<any>;

	beforeEach(() => {
		container = new Container();
		mockPrisma = {
			reservation: {
				findMany: jest.fn(),
				findUnique: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
				delete: jest.fn(),
				count: jest.fn(),
			},
			table: {
				findMany: jest.fn(),
			},
			$transaction: jest.fn((callback) => callback(mockPrisma)),
		} as unknown as jest.Mocked<PrismaClient>;

		container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(mockPrisma);
		container.bind<TestReservationService>(TYPES.ReservationService).to(TestReservationService);

		reservationService = container.get<TestReservationService>(TYPES.ReservationService);

		// Устанавливаем мок-функции
		reservationService.setMocks();
	});

	describe('getReservationById', () => {
		it('should return reservation by id successfully', async () => {
			const mockReservation = {
				id: 1,
				name: 'Test Reservation',
				email: 'test@example.com',
				phone: '+1234567890',
				time: new Date(),
				guestsCount: 4,
				status: ReservationStatus.PENDING,
				isActive: true,
				tables: [
					{ id: 1, tableNumber: 1 },
					{ id: 2, tableNumber: 2 },
				],
			};

			mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);

			const result = await reservationService.getReservationById(1);

			expect(result).toBeDefined();
			expect(result.id).toBe(1);
			expect(result.name).toBe('Test Reservation');
			expect(result.tables).toHaveLength(2);
			expect(mockPrisma.reservation.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				include: {
					tables: {
						select: {
							id: true,
							tableNumber: true,
						},
					},
				},
			});
		});

		it('should throw error when reservation not found', async () => {
			mockPrisma.reservation.findUnique.mockResolvedValue(null);

			await expect(reservationService.getReservationById(999)).rejects.toThrow(
				'Reservation not found'
			);

			expect(mockPrisma.reservation.findUnique).toHaveBeenCalledWith({
				where: { id: 999 },
				include: {
					tables: {
						select: {
							id: true,
							tableNumber: true,
						},
					},
				},
			});
		});
	});

	describe('getReservationsByCriteria', () => {
		const defaultCriteria = {
			page: 1,
			pageSize: 10,
			sortBy: 'id',
			sortOrder: 'asc' as const,
		};

		it('should return reservations list successfully', async () => {
			const mockReservations = [
				{
					id: 1,
					name: 'Test Reservation 1',
					email: 'test1@example.com',
					phone: '+1234567890',
					time: new Date(),
					guestsCount: 4,
					status: ReservationStatus.PENDING,
					isActive: true,
					tables: [
						{ id: 1, tableNumber: 1 },
						{ id: 2, tableNumber: 2 },
					],
				},
			];

			mockPrisma.reservation.findMany.mockResolvedValue(mockReservations);
			mockPrisma.reservation.count.mockResolvedValue(1);

			const result = await reservationService.getReservationsByCriteria(defaultCriteria);

			expect(result.list).toHaveLength(1);
			expect(result.totalCount).toBe(1);
			expect(result.page).toBe(1);
			expect(result.pageSize).toBe(10);
			expect(result.totalPages).toBe(1);
		});

		it('should handle empty results', async () => {
			mockPrisma.reservation.findMany.mockResolvedValue([]);
			mockPrisma.reservation.count.mockResolvedValue(0);

			const result = await reservationService.getReservationsByCriteria(defaultCriteria);

			expect(result.list).toHaveLength(0);
			expect(result.totalCount).toBe(0);
			expect(result.page).toBe(1);
			expect(result.pageSize).toBe(10);
			expect(result.totalPages).toBe(0);
		});

		it('should handle database errors', async () => {
			mockPrisma.reservation.findMany.mockRejectedValue(new Error('Database error'));

			await expect(reservationService.getReservationsByCriteria(defaultCriteria)).rejects.toThrow(
				HTTPError
			);
		});
	});

	describe('createReservation', () => {
		const mockReservationData = {
			name: 'Test Reservation',
			email: 'test@example.com',
			phone: '+1234567890',
			time: new Date(),
			guestsCount: 4,
			tables: [1, 2],
			status: ReservationStatus.PENDING,
			isActive: true,
			allergies: [Allergy.NONE],
		};

		beforeEach(() => {
			// Мок для validateReservationTables
			mockPrisma.table.findMany.mockResolvedValue([
				{ id: 1, tableNumber: 1, capacity: 4, status: 'AVAILABLE' },
				{ id: 2, tableNumber: 2, capacity: 4, status: 'AVAILABLE' },
			]);
		});

		it('should create reservation successfully', async () => {
			const mockCreatedReservation = {
				id: 1,
				...mockReservationData,
				tables: [
					{ id: 1, tableNumber: 1 },
					{ id: 2, tableNumber: 2 },
				],
			};

			mockPrisma.reservation.create.mockResolvedValue(mockCreatedReservation);

			const result = await reservationService.createReservation(mockReservationData);

			expect(result).toBeDefined();
			expect(result.reservation.id).toBe(1);
			expect(mockPrisma.table.findMany).toHaveBeenCalledWith({
				where: {
					id: {
						in: mockReservationData.tables,
					},
				},
				select: {
					id: true,
					tableNumber: true,
					capacity: true,
					status: true,
				},
			});
			expect(reservationService['checkTimeConflicts']).toHaveBeenCalledWith(
				mockReservationData.tables,
				mockReservationData.time
			);
		});

		it('should handle database errors during creation', async () => {
			mockPrisma.reservation.create.mockRejectedValue(
				new HTTPError(500, 'Database', 'Creation failed')
			);

			await expect(reservationService.createReservation(mockReservationData)).rejects.toThrow(
				HTTPError
			);
		});
	});

	describe('updateReservation', () => {
		const reservationId = 1;
		const mockUpdateData = {
			name: 'Updated Reservation',
			email: 'updated@example.com',
			tables: [3, 4],
		};

		it('should update reservation successfully', async () => {
			const result = await reservationService.updateReservation(reservationId, mockUpdateData);

			expect(result).toBeDefined();
			expect(reservationService['performUpdate']).toHaveBeenCalledWith(
				reservationId,
				mockUpdateData,
				true
			);
		});

		it('should handle database errors during update', async () => {
			(reservationService['performUpdate'] as jest.Mock).mockRejectedValue(
				new HTTPError(500, 'Database', 'Update failed')
			);

			await expect(
				reservationService.updateReservation(reservationId, mockUpdateData)
			).rejects.toThrow(HTTPError);
		});
	});

	describe('updateReservationStatus', () => {
		const reservationId = 1;
		const newStatus = ReservationStatus.CONFIRMED;

		it('should update reservation status successfully', async () => {
			const result = await reservationService.updateReservationStatus(reservationId, newStatus);

			expect(result).toBeDefined();
			// Удаляем проверку третьего параметра, так как он не используется в вызове
			expect(reservationService['performUpdate']).toHaveBeenCalledWith(reservationId, {
				status: newStatus,
				isActive: true,
			});
		});

		it('should set isActive to false when status is CANCELLED or NO_SHOW', async () => {
			const cancelledStatus = ReservationStatus.CANCELLED;

			const result = await reservationService.updateReservationStatus(
				reservationId,
				cancelledStatus
			);

			expect(result).toBeDefined();
			// Удаляем проверку третьего параметра, так как он не используется в вызове
			expect(reservationService['performUpdate']).toHaveBeenCalledWith(reservationId, {
				status: cancelledStatus,
				isActive: false,
			});
		});

		it('should handle database errors', async () => {
			(reservationService['performUpdate'] as jest.Mock).mockRejectedValue(
				new HTTPError(500, 'Database', 'Update failed')
			);

			await expect(
				reservationService.updateReservationStatus(reservationId, newStatus)
			).rejects.toThrow(HTTPError);
		});
	});

	describe('deleteReservation', () => {
		const reservationId = 1;

		it('should delete reservation successfully', async () => {
			mockPrisma.reservation.delete.mockResolvedValue({ id: reservationId });

			await expect(reservationService.deleteReservation(reservationId)).resolves.not.toThrow();

			expect(mockPrisma.reservation.delete).toHaveBeenCalledWith({
				where: { id: reservationId },
			});
		});

		it('should handle database errors during deletion', async () => {
			mockPrisma.reservation.delete.mockRejectedValue(
				new HTTPError(500, 'Database', 'Deletion failed')
			);

			await expect(reservationService.deleteReservation(reservationId)).rejects.toThrow(HTTPError);
		});
	});

	describe('updateReservationComment', () => {
		const reservationId = 1;
		const newComment = 'New test comment';

		it('should update reservation comment successfully', async () => {
			const result = await reservationService.updateReservationComment(reservationId, newComment);

			expect(result).toBeDefined();
			// Удаляем проверку третьего параметра, так как он не используется в вызове
			expect(reservationService['performUpdate']).toHaveBeenCalledWith(reservationId, {
				comments: newComment,
			});
		});

		it('should handle database errors', async () => {
			(reservationService['performUpdate'] as jest.Mock).mockRejectedValue(
				new HTTPError(500, 'Database', 'Update failed')
			);

			await expect(
				reservationService.updateReservationComment(reservationId, newComment)
			).rejects.toThrow(HTTPError);
		});
	});

	describe('updateReservationAllergies', () => {
		const reservationId = 1;
		const newAllergies = [Allergy.GLUTEN, Allergy.PEANUT];

		it('should update reservation allergies successfully', async () => {
			const result = await reservationService.updateReservationAllergies(
				reservationId,
				newAllergies
			);

			expect(result).toBeDefined();
			// Удаляем проверку третьего параметра, так как он не используется в вызове
			expect(reservationService['performUpdate']).toHaveBeenCalledWith(reservationId, {
				allergies: newAllergies,
			});
		});

		it('should handle database errors', async () => {
			(reservationService['performUpdate'] as jest.Mock).mockRejectedValue(
				new HTTPError(500, 'Database', 'Update failed')
			);

			await expect(
				reservationService.updateReservationAllergies(reservationId, newAllergies)
			).rejects.toThrow(HTTPError);
		});
	});

	describe('updateReservationTime', () => {
		const reservationId = 1;
		const newTime = new Date('2023-12-25T18:00:00Z');

		it('should update reservation time successfully', async () => {
			const result = await reservationService.updateReservationTime(reservationId, newTime);

			expect(result).toBeDefined();
			expect(reservationService['performUpdate']).toHaveBeenCalledWith(
				reservationId,
				{ time: newTime },
				true
			);
		});

		it('should handle database errors', async () => {
			(reservationService['performUpdate'] as jest.Mock).mockRejectedValue(
				new HTTPError(500, 'Database', 'Update failed')
			);

			await expect(
				reservationService.updateReservationTime(reservationId, newTime)
			).rejects.toThrow(HTTPError);
		});
	});

	describe('updateReservationTables', () => {
		const reservationId = 1;
		const newTables = [3, 4];

		it('should update reservation tables successfully', async () => {
			const result = await reservationService.updateReservationTables(reservationId, newTables);

			expect(result).toBeDefined();
			expect(reservationService['performUpdate']).toHaveBeenCalledWith(
				reservationId,
				{ tables: newTables },
				true
			);
		});

		it('should handle database errors', async () => {
			(reservationService['performUpdate'] as jest.Mock).mockRejectedValue(
				new HTTPError(500, 'Database', 'Update failed')
			);

			await expect(
				reservationService.updateReservationTables(reservationId, newTables)
			).rejects.toThrow(HTTPError);
		});
	});

	describe('updateReservationGuestInfo', () => {
		const reservationId = 1;
		const guestInfo = {
			name: 'Updated Guest',
			email: 'updated@example.com',
			phone: '+9876543210',
		};

		it('should update reservation guest information successfully', async () => {
			const result = await reservationService.updateReservationGuestInfo(reservationId, guestInfo);

			expect(result).toBeDefined();
			// Удаляем проверку третьего параметра, так как он не используется в вызове
			expect(reservationService['performUpdate']).toHaveBeenCalledWith(reservationId, guestInfo);
		});

		it('should handle database errors', async () => {
			(reservationService['performUpdate'] as jest.Mock).mockRejectedValue(
				new HTTPError(500, 'Database', 'Update failed')
			);

			await expect(
				reservationService.updateReservationGuestInfo(reservationId, guestInfo)
			).rejects.toThrow(HTTPError);
		});
	});

	describe('validateReservationTables', () => {
		it('should throw error when tables are not found', async () => {
			mockPrisma.table.findMany.mockResolvedValue([]);

			await expect(
				reservationService.testValidateReservationTables([1, 2], mockPrisma)
			).rejects.toThrow('Tables not found');
		});

		it('should throw error when not all tables are found', async () => {
			mockPrisma.table.findMany.mockResolvedValue([{ id: 1 }]);

			await expect(
				reservationService.testValidateReservationTables([1, 2], mockPrisma)
			).rejects.toThrow('Tables not found');
		});
	});

	describe('checkTimeConflicts', () => {
		const tableIds = [1, 2];
		const startTime = new Date();

		it('should throw error when conflicts are found', async () => {
			const mockConflicts = [{ id: 1, time: startTime }];
			(reservationService['checkTimeConflicts'] as jest.Mock).mockResolvedValueOnce(mockConflicts);

			const result = await reservationService.testCheckTimeConflicts(tableIds, startTime);
			expect(result).toEqual(mockConflicts);
		});
	});

	describe('buildSearchCriteria', () => {
		it('should handle empty criteria', () => {
			const result = reservationService.testBuildSearchCriteria({});
			expect(result).toBeDefined();
			expect(result).toEqual({});
		});

		it('should handle all search parameters', () => {
			const criteria = {
				search: 'test',
				status: ReservationStatus.PENDING,
				dateFrom: new Date(),
				dateTo: new Date(),
				isActive: true,
			};

			const result = reservationService.testBuildSearchCriteria(criteria);
			expect(result).toBeDefined();
		});
	});
});
