import { PrismaClient } from '@prisma/client';
import { NextFunction } from 'express';
import 'reflect-metadata';
import { TypedRequest } from '../../common/route.interface';
import { OrderCreateDTO, OrderFullSingleDTO, OrderSearchCriteria } from '../../dto/orders.dto';
import { ILogger } from '../../services/logger/logger.service.interface';
import { OrdersService } from '../../services/orders/order.service';
import { OrdersController } from './orders.controller';
jest.mock('../../services/orders/order.service');
jest.mock('../../services/logger/logger.service.interface');

describe('OrdersController', () => {
	let ordersController: OrdersController;
	let ordersService: jest.Mocked<OrdersService>;
	let loggerService: jest.Mocked<ILogger>;
	let req: TypedRequest<{}, {}, {}>;
	let res: any;
	let next: NextFunction;
	let okSpy: jest.SpyInstance;
	let prisma: PrismaClient;

	beforeEach(() => {
		prisma = new PrismaClient();

		// Мокирование необходимых методов PrismaClient с использованием jest.spyOn
		jest.spyOn(prisma.order, 'findMany').mockResolvedValue([]);
		jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(null);
		jest.spyOn(prisma.order, 'count').mockResolvedValue(0);
		// Добавьте другие методы по необходимости

		ordersService = new OrdersService(prisma) as jest.Mocked<OrdersService>;
		loggerService = {
			log: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
		} as unknown as jest.Mocked<ILogger>;

		ordersController = new OrdersController(loggerService, ordersService);

		req = {
			params: {},
			query: {},
			body: {},
		} as any;

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;

		next = jest.fn();

		okSpy = jest.spyOn(ordersController, 'ok').mockImplementation(() => res);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getOrders', () => {
		it('должен возвращать список заказов', async () => {
			const mockOrders = { orders: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 };
			ordersService.findOrders.mockResolvedValue(mockOrders);

			await ordersController.getOrders(req as TypedRequest<{}, OrderSearchCriteria, {}>, res, next);

			expect(ordersService.findOrders).toHaveBeenCalledWith(req.query);
			expect(okSpy).toHaveBeenCalledWith(res, mockOrders);
		});

		it('должен вызывать next с ошибкой при сбое', async () => {
			const error = new Error('Ошибка сервиса');
			ordersService.findOrders.mockRejectedValue(error);

			await ordersController.getOrders(req as TypedRequest<{}, OrderSearchCriteria, {}>, res, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getOrderById', () => {
		it('должен возвращать заказ по ID', async () => {
			const mockOrder = {
				id: 1,
				tableNumber: 5,
				guestsCount: 4,
				status: 'AWAITING',
				orderTime: new Date(),
				updatedAt: new Date(),
				serverId: 1,
				totalAmount: 0,
				allergies: [],
				comments: '',
				discount: 0,
				shiftId: 1,
				completionTime: new Date(),
				paymentStatus: 'PENDING',
			} as unknown as OrderFullSingleDTO;
			ordersService.findOrderById.mockResolvedValue(mockOrder);

			req.params.id = '1';
			await ordersController.getOrderById(req as TypedRequest<{ id: number }, {}, {}>, res, next);

			expect(ordersService.findOrderById).toHaveBeenCalledWith(1);
			expect(okSpy).toHaveBeenCalledWith(res, mockOrder);
		});

		it('должен вызывать next с ошибкой при отсутствии заказа', async () => {
			const error = new Error('Заказ не найден');
			ordersService.findOrderById.mockRejectedValue(error);

			req.params.id = '999';
			await ordersController.getOrderById(req as TypedRequest<{ id: number }, {}, {}>, res, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('createOrder', () => {
		it('должен создавать новый заказ', async () => {
			const mockOrder = {
				id: 1,
				tableNumber: 3,
				guestsCount: 1,
				orderNumber: 1,
				paymentStatus: 'PENDING',
				orderTime: new Date(),
				updatedAt: new Date(),
				tip: 0,
				totalAmount: 0,
				status: 'RECEIVED',
				completionTime: null,
				comments: '',
				shiftId: '1',
				foodItems: [],
				drinkItems: [],
			} as unknown as OrderFullSingleDTO;
			ordersService.createOrder.mockResolvedValue(mockOrder);

			req.body = { tableNumber: 3 };
			await ordersController.createOrder(req as TypedRequest<{}, {}, OrderCreateDTO>, res, next);

			expect(ordersService.createOrder).toHaveBeenCalledWith(req.body);
			expect(loggerService.log).toHaveBeenCalledWith('Order for table 3 created successfully');
			expect(okSpy).toHaveBeenCalledWith(res, mockOrder);
		});

		it('должен вызывать next с ошибкой при сбое создания заказа', async () => {
			const error = new Error('Ошибка создания заказа');
			ordersService.createOrder.mockRejectedValue(error);

			req.body = { tableNumber: 3 };
			await ordersController.createOrder(req as TypedRequest<{}, {}, OrderCreateDTO>, res, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	// Добавьте дополнительные тесты для других методов контроллера аналогично
});
