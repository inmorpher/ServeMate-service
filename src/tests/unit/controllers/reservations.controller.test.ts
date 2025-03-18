import { NextFunction, Response } from 'express';
import { Container } from 'inversify';
import 'reflect-metadata';
import { Allergies, ListReturnType, ReservationStatus } from '../../../../dto-package/src';
import {
	CreateReservationDTO,
	ReservationDTO,
	ReservationGuestInfo,
	ReservationSearchCriteriaDTO,
	ReservationWithTablesDTO,
	UpdateReservationDTO,
} from '../../../../dto-package/src/dto/reservation.dto';
import { TypedRequest } from '../../../common/route.interface';
import { ReservationController } from '../../../controllers/reservations/reservation.controller';
import { ILogger } from '../../../services/logger/logger.service.interface';
import { ReservationService } from '../../../services/reservations/reservation.service';
import { TYPES } from '../../../types';

describe('ReservationController', () => {
	let reservationController: ReservationController;
	let reservationService: jest.Mocked<ReservationService>;
	let loggerService: jest.Mocked<ILogger>;
	let res: Partial<Response>;
	let next: NextFunction;
	let okSpy: jest.SpyInstance;

	const mockReservation: ReservationDTO = {
		id: 1,
		time: new Date(),
		guestsCount: 4,
		status: ReservationStatus.PENDING,
		tables: [1, 2],
		comments: 'Test reservation',
		allergies: [Allergies.DAIRY],
		name: 'John Doe',
		phone: '+1234567890',
		email: 'john@example.com',
		createdAt: new Date(),
		updatedAt: new Date(),
		isActive: true,
	};

	const mockReservationWithTables: ReservationWithTablesDTO = {
		...mockReservation,
		tables: [
			{
				id: 1,
				tableNumber: 1,
			},
			{
				id: 2,
				tableNumber: 2,
			},
		],
	};

	beforeEach(() => {
		reservationService = {
			createReservation: jest.fn(),
			getReservationById: jest.fn(),
			getReservationsByCriteria: jest.fn(),
			updateReservation: jest.fn(),
			updateReservationStatus: jest.fn(),
			updateReservationTime: jest.fn(),
			updateReservationTables: jest.fn(),
			updateReservationGuestInfo: jest.fn(),
			updateReservationComment: jest.fn(),
			updateReservationAllergies: jest.fn(),
			deleteReservation: jest.fn(),
		} as any;

		loggerService = {
			log: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
		} as any;

		const container = new Container();
		container.bind<ILogger>(TYPES.ILogger).toConstantValue(loggerService);
		container
			.bind<ReservationService>(TYPES.ReservationService)
			.toConstantValue(reservationService);

		reservationController = new ReservationController(loggerService, reservationService);

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockResponse = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(),
		} as unknown as Response;

		okSpy = jest.spyOn(reservationController, 'ok').mockImplementation(() => mockResponse);
		next = jest.fn();
	});

	describe('createReservation', () => {
		it('should create a reservation successfully', async () => {
			const createReservationMock = {
				...mockReservation,
				tables: [
					{
						id: 1,
						tableNumber: 1,
					},
					{
						id: 2,
						tableNumber: 2,
					},
				],
			};

			const req = {
				body: createReservationMock,
				query: {},
				params: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{}, {}, CreateReservationDTO>;

			reservationService.createReservation.mockResolvedValue({
				reservation: createReservationMock,
				conflict: [],
			});

			await reservationController.createReservation(req, res as Response, next);

			expect(reservationService.createReservation).toHaveBeenCalledWith(createReservationMock);
			expect(okSpy).toHaveBeenCalledWith(res, {
				reservation: createReservationMock,
				conflict: [],
			});
		});

		it('should handle errors when creating reservation', async () => {
			const error = new Error('Creation failed');
			const req = {
				body: {} as CreateReservationDTO,
				query: {},
				params: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{}, {}, CreateReservationDTO>;

			reservationService.createReservation.mockRejectedValue(error);

			await reservationController.createReservation(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getReservationById', () => {
		it('should return a reservation by ID successfully', async () => {
			const req = {
				params: { id: '1' },
				body: {},
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{ id: string }, {}, {}>;

			reservationService.getReservationById.mockResolvedValue(mockReservationWithTables);
			mockReservationWithTables.tables;

			await reservationController.getReservationById(req, res as Response, next);

			expect(reservationService.getReservationById).toHaveBeenCalledWith(1);
			expect(okSpy).toHaveBeenCalledWith(res, mockReservationWithTables);
		});

		it('should handle errors when getting reservation by ID', async () => {
			const error = new Error('Reservation not found');
			const req = {
				params: { id: '999' },
				body: {},
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{ id: string }, {}, {}>;

			reservationService.getReservationById.mockRejectedValue(error);

			await reservationController.getReservationById(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getAllReservations', () => {
		it('should return list of reservations successfully', async () => {
			const mockResult: ListReturnType<ReservationWithTablesDTO> = {
				list: [mockReservationWithTables],
				totalCount: 1,
				page: 1,
				pageSize: 10,
				totalPages: 1,
			};

			const searchCriteria: ReservationSearchCriteriaDTO = {
				page: 1,
				pageSize: 10,
				sortBy: 'time',
				sortOrder: 'asc',
			};

			const req = {
				query: searchCriteria,
				body: {},
				params: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{}, ReservationSearchCriteriaDTO, {}>;

			reservationService.getReservationsByCriteria.mockResolvedValue(mockResult);

			await reservationController.getAllReservations(req, res as Response, next);

			expect(reservationService.getReservationsByCriteria).toHaveBeenCalledWith(searchCriteria);
			expect(okSpy).toHaveBeenCalledWith(res, mockResult);
		});

		it('should handle errors when getting reservations', async () => {
			const error = new Error('Database error');
			const req = {
				query: { page: 1, pageSize: 10, sortBy: 'time' as const, sortOrder: 'asc' as const },
				body: {},
				params: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{}, ReservationSearchCriteriaDTO, {}>;

			reservationService.getReservationsByCriteria.mockRejectedValue(error);

			await reservationController.getAllReservations(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('updateReservation', () => {
		it('should update a reservation successfully', async () => {
			const updateData = {
				guestsCount: 6,
				tables: [3, 4],
			};

			const req = {
				params: { id: '1' },
				body: updateData,
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<
				{
					id: Pick<ReservationDTO, 'id'>;
				},
				{},
				UpdateReservationDTO
			>;

			reservationService.updateReservation.mockResolvedValue({
				reservation: mockReservationWithTables,
				conflict: [],
			});
			await reservationController.updateReservation(req, res as Response, next);

			expect(reservationService.updateReservation).toHaveBeenCalledWith(1, updateData);
			expect(okSpy).toHaveBeenCalledWith(res, {
				reservation: mockReservationWithTables,
				conflict: [],
			});
		});

		it('should handle errors when updating reservation', async () => {
			const error = new Error('Update failed');
			const req = {
				params: { id: '1' },
				body: {},
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, {}>;

			reservationService.updateReservation.mockRejectedValue(error);

			await reservationController.updateReservation(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('updateReservationStatus', () => {
		it('should update reservation status successfully', async () => {
			const req = {
				params: { id: '1' },
				body: { status: ReservationStatus.CONFIRMED },
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<
				{ id: Pick<ReservationDTO, 'id'> },
				{},
				{ status: ReservationStatus }
			>;

			reservationService.updateReservationStatus.mockResolvedValue({
				reservation: mockReservationWithTables,
				conflict: [],
			});

			await reservationController.updateReservationStatus(req, res as Response, next);

			expect(reservationService.updateReservationStatus).toHaveBeenCalledWith(
				1,
				ReservationStatus.CONFIRMED
			);
			expect(okSpy).toHaveBeenCalledWith(res, {
				reservation: mockReservationWithTables,
				conflict: [],
			});
		});
	});

	describe('updateReservationTime', () => {
		it('should update reservation time successfully', async () => {
			const newTime = new Date();
			const req = {
				params: { id: '1' },
				body: { time: newTime },
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, { time: Date }>;

			reservationService.updateReservationTime.mockResolvedValue({
				reservation: mockReservationWithTables,
				conflict: [],
			});

			await reservationController.updateReservationTime(req, res as Response, next);

			expect(reservationService.updateReservationTime).toHaveBeenCalledWith(1, newTime);
			expect(okSpy).toHaveBeenCalledWith(res, {
				reservation: mockReservationWithTables,
				conflict: [],
			});
		});
	});

	describe('updateReservationTables', () => {
		it('should update reservation tables successfully', async () => {
			const newTables = [3, 4];
			const req = {
				params: { id: '1' },
				body: { tables: newTables },
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, { tables: number[] }>;

			reservationService.updateReservationTables.mockResolvedValue({
				reservation: mockReservationWithTables,
				conflict: [],
			});

			await reservationController.updateReservationTables(req, res as Response, next);

			expect(reservationService.updateReservationTables).toHaveBeenCalledWith(1, newTables);
			expect(okSpy).toHaveBeenCalledWith(res, {
				reservation: mockReservationWithTables,
				conflict: [],
			});
		});
	});

	describe('updateReservationGuestInfo', () => {
		it('should update reservation guest info successfully', async () => {
			const newGuestInfo: ReservationGuestInfo = {
				name: 'Jane Doe',
				phone: '+9876543210',
				email: 'jane@example.com',
			};

			const req = {
				params: { id: '1' },
				body: { guestInfo: newGuestInfo },
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<
				{ id: Pick<ReservationDTO, 'id'> },
				{},
				{ guestInfo: ReservationGuestInfo }
			>;

			reservationService.updateReservationGuestInfo.mockResolvedValue({
				reservation: mockReservationWithTables,
				conflict: [],
			});

			await reservationController.updateReservationGuestInfo(req, res as Response, next);

			expect(reservationService.updateReservationGuestInfo).toHaveBeenCalledWith(1, newGuestInfo);
			expect(okSpy).toHaveBeenCalledWith(res, {
				reservation: mockReservationWithTables,
				conflict: [],
			});
		});
	});

	describe('updateReservationComment', () => {
		it('should update reservation comment successfully', async () => {
			const newComment = 'Updated comment';
			const req = {
				params: { id: '1' },
				body: { comments: newComment },
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, { comments: string }>;

			reservationService.updateReservationComment.mockResolvedValue({
				reservation: mockReservationWithTables,
				conflict: [],
			});

			await reservationController.updateReservationComment(req, res as Response, next);

			expect(reservationService.updateReservationComment).toHaveBeenCalledWith(1, newComment);
			expect(okSpy).toHaveBeenCalledWith(res, {
				reservation: mockReservationWithTables,
				conflict: [],
			});
		});
	});

	describe('updateReservationAllergies', () => {
		it('should update reservation allergies successfully', async () => {
			const newAllergies: Allergies[] = [Allergies.DAIRY, Allergies.SOY];
			const req = {
				params: { id: '1' },
				body: { allergies: newAllergies },
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<
				{ id: Pick<ReservationDTO, 'id'> },
				{},
				{ allergies: Allergies[] }
			>;

			reservationService.updateReservationAllergies.mockResolvedValue({
				reservation: mockReservationWithTables,
				conflict: [],
			});

			await reservationController.updateReservationAllergies(req, res as Response, next);

			expect(reservationService.updateReservationAllergies).toHaveBeenCalledWith(1, newAllergies);
			expect(okSpy).toHaveBeenCalledWith(res, {
				reservation: mockReservationWithTables,
				conflict: [],
			});
		});
	});

	describe('deleteReservation', () => {
		it('should delete a reservation successfully', async () => {
			const req = {
				params: { id: '1' },
				body: {},
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, {}>;

			reservationService.deleteReservation.mockResolvedValue(undefined);

			await reservationController.deleteReservation(req, res as Response, next);

			expect(reservationService.deleteReservation).toHaveBeenCalledWith(1);
			expect(okSpy).toHaveBeenCalledWith(res, { message: 'Reservation deleted successfully' });
		});

		it('should handle errors when deleting reservation', async () => {
			const error = new Error('Delete failed');
			const req = {
				params: { id: '1' },
				body: {},
				query: {},
				cookies: {},
				signedCookies: {},
				get: jest.fn(),
			} as unknown as TypedRequest<{ id: Pick<ReservationDTO, 'id'> }, {}, {}>;

			reservationService.deleteReservation.mockRejectedValue(error);

			await reservationController.deleteReservation(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
