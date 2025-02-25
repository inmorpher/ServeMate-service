import { OrderState } from '@prisma/client';
import {
	OrderCreateDTO,
	OrderSearchCriteria,
	OrderUpdateItems,
	OrderUpdateProps,
} from '@servemate/dto';
import { NextFunction, Request, Response } from 'express';
import 'reflect-metadata';
import { TypedRequest } from '../../../common/route.interface';
import { OrdersController } from '../../../controllers/orders/orders.controller';
import { ILogger } from '../../../services/logger/logger.service.interface';
import { OrdersService } from '../../../services/orders/order.service';

describe('OrdersController', () => {
	let ordersController: OrdersController;
	let ordersService: jest.Mocked<OrdersService>;
	let loggerService: jest.Mocked<ILogger>;
	let res: Partial<Response>;
	let next: NextFunction;

	const mockOrder = {
		id: 1,
		tableNumber: 5,
		guestsCount: 2,
		status: 'AWAITING' as OrderState,
		serverId: 1,
		server: { id: 1, name: 'Test Server' },
		orderTime: new Date(),
		totalAmount: 0,
		subtotal: 0,
		tax: 0,
		tip: 0,
		discount: 0,
		venueId: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		shiftId: null,
		foodItems: [],
		drinkItems: [],
		allergies: [],
	};

	const mockRequest = (params = {}, query = {}, body = {}) => {
		return {
			params,
			query,
			body,
			cookies: {},
			signedCookies: {},
			get: jest.fn(),
			header: jest.fn(),
			// ... other Express.Request properties as needed
		} as unknown as Request;
	};

	beforeEach(() => {
		ordersService = {
			findOrders: jest.fn(),
			findOrderById: jest.fn(),
			createOrder: jest.fn(),
			updateItemsInOrder: jest.fn(),
			updateOrderProperties: jest.fn(),
			printOrderItems: jest.fn(),
			callOrderItems: jest.fn(),
			delete: jest.fn(),
		} as any;

		loggerService = {
			log: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
		} as any;

		ordersController = new OrdersController(loggerService, ordersService);
		jest.spyOn(ordersController as any, 'ok');
		jest.spyOn(ordersController as any, 'noContent');

		res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};

		next = jest.fn();
	});

	describe('getOrders', () => {
		it('should return a list of orders successfully', async () => {
			const mockOrders = { orders: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 };
			const req = mockRequest({}, { page: 1, pageSize: 10 }) as TypedRequest<
				{},
				OrderSearchCriteria,
				{}
			>;

			ordersService.findOrders.mockResolvedValue(mockOrders);

			await ordersController.getOrders(req, res as Response, next);

			expect(ordersService.findOrders).toHaveBeenCalledWith(req.query);
			expect(ordersController['ok']).toHaveBeenCalledWith(res, mockOrders);
		});

		it('should handle errors when getting orders', async () => {
			const error = new Error('Database error');
			const req = mockRequest({}, {}) as TypedRequest<{}, OrderSearchCriteria, {}>;

			ordersService.findOrders.mockRejectedValue(error);

			await ordersController.getOrders(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getOrderById', () => {
		it('should return an order by ID successfully', async () => {
			const req = mockRequest({ id: 1 }) as TypedRequest<{ id: number }, {}, {}>;

			ordersService.findOrderById.mockResolvedValue(mockOrder);

			await ordersController.getOrderById(req, res as Response, next);

			expect(ordersService.findOrderById).toHaveBeenCalledWith(1);
			expect(ordersController['ok']).toHaveBeenCalledWith(res, mockOrder);
		});

		it('should handle errors when getting order by ID', async () => {
			const error = new Error('Order not found');
			const req = mockRequest({ id: 999 }) as TypedRequest<{ id: number }, {}, {}>;

			ordersService.findOrderById.mockRejectedValue(error);

			await ordersController.getOrderById(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('createOrder', () => {
		it('should create an order successfully', async () => {
			const req = mockRequest({}, {}, { tableNumber: 5, guestsCount: 2 }) as TypedRequest<
				{},
				{},
				OrderCreateDTO
			>;

			ordersService.createOrder.mockResolvedValue(mockOrder);

			await ordersController.createOrder(req, res as Response, next);

			expect(ordersService.createOrder).toHaveBeenCalledWith(req.body);
			expect(loggerService.log).toHaveBeenCalledWith(
				`Order for table ${req.body.tableNumber} created successfully`
			);
			expect(ordersController['noContent']).toHaveBeenCalledWith(res);
		});

		it('should handle errors when creating order', async () => {
			const error = new Error('Creation failed');
			const req = mockRequest({}, {}, { tableNumber: 5 }) as TypedRequest<{}, {}, OrderCreateDTO>;

			ordersService.createOrder.mockRejectedValue(error);

			await ordersController.createOrder(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('updateOrderItems', () => {
		it('should update order items successfully', async () => {
			const updateBody = {
				foodItems: [
					{
						guestNumber: 1,
						items: [
							{
								foodId: 1,
								quantity: 1,
								notes: '',
								allergies: ['NONE'],
								modifiers: [],
								status: 'PENDING',
								paymentStatus: 'NONE',
							},
						],
					},
				],
				drinkItems: [],
			};
			const req = mockRequest({ id: 1 }, {}, updateBody) as TypedRequest<
				{ id: number },
				{},
				OrderUpdateItems
			>;

			ordersService.updateItemsInOrder.mockResolvedValue(mockOrder);

			await ordersController.updateOrderItems(req, res as Response, next);

			expect(ordersService.updateItemsInOrder).toHaveBeenCalledWith(1, req.body);
			expect(ordersController['noContent']).toHaveBeenCalledWith(res);
		});

		it('should handle errors when updating order items', async () => {
			const error = new Error('Update failed');
			const req = mockRequest({ id: 1 }, {}, { foodItems: [], drinkItems: [] }) as TypedRequest<
				{ id: number },
				{},
				OrderUpdateItems
			>;

			ordersService.updateItemsInOrder.mockRejectedValue(error);

			await ordersController.updateOrderItems(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('updateOrderProperties', () => {
		it('should update order properties successfully', async () => {
			const req = mockRequest({ id: 1 }, {}, { status: 'COMPLETED' as const }) as TypedRequest<
				{ id: number },
				{},
				OrderUpdateProps
			>;

			ordersService.updateOrderProperties.mockResolvedValue(mockOrder);

			await ordersController.updateOrderProperties(req, res as Response, next);

			expect(ordersService.updateOrderProperties).toHaveBeenCalledWith(1, req.body);
			expect(ordersController['noContent']).toHaveBeenCalledWith(res);
		});

		it('should handle errors when updating order properties', async () => {
			const error = new Error('Update failed');
			const req = mockRequest({ id: 1 }, {}, { status: 'COMPLETED' }) as TypedRequest<
				{ id: number },
				{},
				OrderUpdateProps
			>;

			ordersService.updateOrderProperties.mockRejectedValue(error);

			await ordersController.updateOrderProperties(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('orderItemsPrint', () => {
		it('should print order items successfully', async () => {
			const mockPrintResult = 'Items printed successfully';
			const req = mockRequest({ id: 1 }, {}, { ids: [1, 2, 3] }) as TypedRequest<
				{ id: number },
				{},
				{ ids: number[] }
			>;

			ordersService.printOrderItems.mockResolvedValue(mockPrintResult);

			await ordersController.orderItemsPrint(req, res as Response, next);

			expect(ordersService.printOrderItems).toHaveBeenCalledWith(1, [1, 2, 3]);
			expect(ordersController['noContent']).toHaveBeenCalledWith(res);
		});

		it('should handle errors when printing order items', async () => {
			const error = new Error('Printing failed');
			const req = mockRequest({ id: 1 }, {}, { ids: [1, 2, 3] }) as TypedRequest<
				{},
				{},
				{ ids: number[] }
			>;

			ordersService.printOrderItems.mockRejectedValue(error);

			await ordersController.orderItemsPrint(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('orderItemsCall', () => {
		it('should call order items successfully', async () => {
			const mockCallResult = 'Items called successfully';
			const req = mockRequest({ id: 1 }, {}, { orderItemsIds: [1, 2, 3] }) as TypedRequest<
				{ id: number },
				{},
				{ orderItemsIds: number[] }
			>;

			ordersService.callOrderItems.mockResolvedValue(mockCallResult);

			await ordersController.orderItemsCall(req, res as Response, next);

			expect(ordersService.callOrderItems).toHaveBeenCalledWith(1, [1, 2, 3]);
			expect(ordersController['noContent']).toHaveBeenCalledWith(res);
		});

		it('should handle errors when calling order items', async () => {
			const error = new Error('Calling failed');
			const req = mockRequest({ id: 1 }, {}, { orderItemsIds: [1, 2, 3] }) as TypedRequest<
				{},
				{},
				{ orderItemsIds: number[] }
			>;

			ordersService.callOrderItems.mockRejectedValue(error);

			await ordersController.orderItemsCall(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('deleteOrder', () => {
		it('should delete an order successfully', async () => {
			const req = mockRequest({ id: 1 }) as TypedRequest<{ id: number }, {}, {}>;

			ordersService.delete.mockResolvedValue();

			await ordersController.deleteOrder(req, res as Response, next);

			expect(ordersService.delete).toHaveBeenCalledWith(1);
			expect(ordersController['noContent']).toHaveBeenCalledWith(res);
		});

		it('should handle errors when deleting order', async () => {
			const error = new Error('Deletion failed');
			const req = mockRequest({ id: 1 }) as TypedRequest<{ id: number }, {}, {}>;

			ordersService.delete.mockRejectedValue(error);

			await ordersController.deleteOrder(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
