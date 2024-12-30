import { NextFunction, Response } from 'express';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TypedRequest } from '../../common/route.interface';
import {
	OrderCreateDTO,
	OrderFullSingleDTO,
	OrderSearchCriteria,
	OrderUpdateProps,
} from '../../dto/orders.dto';
import { ILogger } from '../../services/logger/logger.service.interface';
import { OrdersService } from '../../services/orders/order.service';
import { TYPES } from '../../types';
import { OrdersController } from './orders.controller';

describe('OrdersController', () => {
	let ordersController: OrdersController;
	let ordersService: OrdersService;
	let loggerService: ILogger;
	let req: TypedRequest<{}, OrderSearchCriteria, {}>;
	let res: Partial<Response>;
	let next: NextFunction;

	beforeEach(() => {
		const container = new Container();
		ordersService = {
			findOrders: jest.fn(),
			findOrderById: jest.fn(),
			createOrder: jest.fn(),
			updateItemsInOrder: jest.fn(),
			updateOrderProperties: jest.fn(),
			printOrderItems: jest.fn(),
			callOrderItems: jest.fn(),
			delete: jest.fn(),
		} as unknown as OrdersService;
		loggerService = {
			log: jest.fn(),
		} as unknown as ILogger;

		container.bind<OrdersService>(TYPES.OrdersService).toConstantValue(ordersService);
		container.bind<ILogger>(TYPES.ILogger).toConstantValue(loggerService);

		ordersController = new OrdersController(loggerService, ordersService);

		req = {
			query: {},
		} as TypedRequest<{}, OrderSearchCriteria, {}>;
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		next = jest.fn();
	});

	describe('getOrders', () => {
		it('should retrieve orders successfully', async () => {
			const mockOrders = [{ id: 1, item: 'Pizza' }];
			jest.spyOn(ordersService, 'findOrders').mockResolvedValue(mockOrders);
			const okSpy = jest
				.spyOn(ordersController, 'ok')
				.mockImplementation((res: Response, data: any) => {
					return res.status(200).json(data);
				});

			await ordersController.getOrders(
				req as TypedRequest<{}, OrderSearchCriteria, {}>,
				res as Response,
				next
			);

			expect(ordersService.findOrders).toHaveBeenCalledWith(req.query);
			expect(okSpy).toHaveBeenCalledWith(res, mockOrders);
		});

		it('should handle errors', async () => {
			const error = new Error('Something went wrong');
			(ordersService.findOrders as jest.Mock).mockRejectedValue(error);

			await ordersController.getOrders(req as TypedRequest<any, any, any>, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getOrderById', () => {
		it('should retrieve order by id successfully', async () => {
			const mockOrder: OrderFullSingleDTO = {
				id: 1,
				tableNumber: 5,
				status: 'RECEIVED',
				server: { id: 1, name: 'John Doe' },
				guestsCount: 4,
				orderTime: new Date(),
				foodItems: [],
				drinkItems: [],
				totalAmount: 0,
				shiftId: 'shift123',
				serverId: 1,
				discount: 0,
				comments: 'No salt',
				updatedAt: new Date(),
				paymentStatus: 'NONE',
				tip: 0,
			};
			const req = {
				params: { id: '1' },
			} as unknown as TypedRequest<{ id: number }, {}, {}>;
			jest.spyOn(ordersService, 'findOrderById').mockResolvedValue(mockOrder);
			const okSpy = jest
				.spyOn(ordersController, 'ok')
				.mockImplementation((res: Response, data: any) => {
					return res.status(200).json(data);
				});

			await ordersController.getOrderById(req, res as Response, next);

			expect(ordersService.findOrderById).toHaveBeenCalledWith(1);
			expect(okSpy).toHaveBeenCalledWith(res, mockOrder);
		});

		it('should handle errors', async () => {
			const error = new Error('Something went wrong');
			const req = {
				params: { id: '1' },
			} as unknown as TypedRequest<{ id: number }, {}, {}>;
			(ordersService.findOrderById as jest.Mock).mockRejectedValue(error);

			await ordersController.getOrderById(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('createOrder', () => {
		it('should create order successfully', async () => {
			const mockOrder = {
				id: 1,
				tableNumber: 5,
				status: 'RECEIVED',
				server: { id: 1, name: 'John Doe' },
				guestsCount: 4,
				orderTime: new Date(),
				foodItems: [],
				drinkItems: [],
				totalAmount: 0,
				shiftId: 'shift123',
				serverId: 1,
				discount: 0,
				comments: 'No salt',
				updatedAt: new Date(),
				paymentStatus: 'NONE',
				tip: 0,
			} as OrderFullSingleDTO;
			const req = {
				body: {
					tableNumber: 5,
					status: 'RECEIVED',
					server: { id: 1, name: 'John Doe' },
					guestsCount: 4,
					orderTime: new Date(),
					serverId: 1,
					totalPrice: 20,
					createdAt: new Date(),
					updatedAt: new Date(),
					shiftId: 'shift123',
					discount: 0,
					totalAmount: 0,
					paymentStatus: 'NONE',
					foodItems: [],
					drinkItems: [],
				} as OrderCreateDTO,
			} as unknown as TypedRequest<{}, {}, OrderCreateDTO>;
			jest.spyOn(ordersService, 'createOrder').mockResolvedValue(mockOrder);
			const okSpy = jest
				.spyOn(ordersController, 'ok')
				.mockImplementation((res: Response, data: any) => {
					return res.status(200).json(data);
				});
			const logSpy = jest.spyOn(loggerService, 'log');

			await ordersController.createOrder(req, res as Response, next);

			expect(ordersService.createOrder).toHaveBeenCalledWith(req.body);
			expect(logSpy).toHaveBeenCalledWith(
				`Order for table ${req.body.tableNumber} created successfully`
			);
			expect(okSpy).toHaveBeenCalledWith(res, mockOrder);
		});

		it('should handle errors', async () => {
			const error = new Error('Something went wrong');
			const req = {
				body: {
					tableNumber: 5,
					status: 'RECEIVED',
					server: { id: 1, name: 'John Doe' },
					guestsCount: 4,
					orderTime: new Date(),
					items: [{ id: 1, name: 'Pizza', quantity: 2 }],
					totalPrice: 20,
					createdAt: new Date(),
					updatedAt: new Date(),
					shiftId: 'shift123',
				},
			} as unknown as TypedRequest<{}, {}, OrderCreateDTO>;
			(ordersService.createOrder as jest.Mock).mockRejectedValue(error);

			await ordersController.createOrder(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('updateOrderItems', () => {
		it('should update order items successfully', async () => {
			const mockUpdatedOrder = {
				tableNumber: 5,
				status: 'RECEIVED',
				server: { id: 1, name: 'John Doe' },
				guestsCount: 4,
				orderTime: new Date(),
				serverId: 1,
				totalPrice: 20,
				createdAt: new Date(),
				updatedAt: new Date(),
				shiftId: 'shift123',
				discount: 0,
				totalAmount: 0,
				paymentStatus: 'NONE',
				foodItems: [],
				drinkItems: [],
				tip: 0,
				comments: 'No salt',
				id: 1,
			} as OrderFullSingleDTO;
			const req = {
				params: { id: '1' },
				body: {
					foodItems: [
						{
							guestNumber: 3,
							items: [
								{
									quantity: 1,
									price: 10,
									discount: 0,
									finalPrice: 10,
									specialRequest: null,
									allergies: [],
									name: 'Beef Taceeeos',
									itemId: 10,
								},
							],
						},
					],
				},
			} as unknown as TypedRequest<
				{ id: number },
				{},
				Pick<OrderCreateDTO, 'foodItems' | 'drinkItems'>
			>;
			jest.spyOn(ordersService, 'updateItemsInOrder').mockResolvedValue(mockUpdatedOrder);
			const okSpy = jest
				.spyOn(ordersController, 'ok')
				.mockImplementation((res: Response, data: any) => {
					return res.status(200).json(data);
				});

			await ordersController.updateOrderItems(req, res as Response, next);

			expect(ordersService.updateItemsInOrder).toHaveBeenCalledWith(1, req.body);
			expect(okSpy).toHaveBeenCalledWith(res, mockUpdatedOrder);
		});

		it('should handle errors', async () => {
			const error = new Error('Something went wrong');
			const req = {
				params: { id: '1' },
				body: {
					foodItems: [{ id: 1, name: 'Pizza', quantity: 2 }],
					drinkItems: [{ id: 2, name: 'Coke', quantity: 3 }],
				},
			} as unknown as TypedRequest<
				{ id: number },
				{},
				Pick<OrderCreateDTO, 'foodItems' | 'drinkItems'>
			>;
			(ordersService.updateItemsInOrder as jest.Mock).mockRejectedValue(error);

			await ordersController.updateOrderItems(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('updateOrderProperties', () => {
		it('should update order properties successfully', async () => {
			const mockUpdatedOrder = {
				tableNumber: 5,
				status: 'RECEIVED',
				server: { id: 1, name: 'John Doe' },
				guestsCount: 4,
				orderTime: new Date(),
				serverId: 1,
				totalPrice: 20,
				createdAt: new Date(),
				updatedAt: new Date(),
				shiftId: 'shift123',
				discount: 0,
				totalAmount: 0,
				paymentStatus: 'NONE',
				foodItems: [],
				drinkItems: [],
				tip: 0,
				comments: 'No salt',
				id: 1,
			} as OrderFullSingleDTO;
			const req = {
				params: { id: '1' },
				body: {
					guestsCount: 5,
				} as OrderUpdateProps,
			} as unknown as TypedRequest<{ id: number }, {}, OrderUpdateProps>;
			jest.spyOn(ordersService, 'updateOrderProperties').mockResolvedValue(mockUpdatedOrder);
			const okSpy = jest
				.spyOn(ordersController, 'ok')
				.mockImplementation((res: Response, data: any) => {
					return res.status(200).json(data);
				});

			await ordersController.updateOrderProperties(req, res as Response, next);

			expect(ordersService.updateOrderProperties).toHaveBeenCalledWith(1, req.body);
			expect(okSpy).toHaveBeenCalledWith(res, mockUpdatedOrder);
		});

		it('should handle errors', async () => {
			const error = new Error('Something went wrong');
			const req = {
				params: { id: '1' },
				body: {
					status: 'SERVED',
					guestsCount: 5,
				},
			} as unknown as TypedRequest<{ id: number }, {}, OrderUpdateProps>;
			(ordersService.updateOrderProperties as jest.Mock).mockRejectedValue(error);

			await ordersController.updateOrderProperties(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('orderItemsPrint', () => {
		it('should print order items successfully', async () => {
			const mockPrintedItems = [{ id: 1, name: 'Pizza' }];
			const req = {
				body: { ids: [1, 2, 3] },
			} as unknown as TypedRequest<{}, {}, { ids: number[] }>;
			jest
				.spyOn(ordersService, 'printOrderItems')
				.mockResolvedValue([...mockPrintedItems].toString());
			const okSpy = jest
				.spyOn(ordersController, 'ok')
				.mockImplementation((res: Response, data: any) => {
					return res.status(200).json(data);
				});

			await ordersController.orderItemsPrint(req, res as Response, next);

			expect(ordersService.printOrderItems).toHaveBeenCalledWith(req.body.ids);
			expect(okSpy).toHaveBeenCalled();
		});

		it('should handle errors', async () => {
			const error = new Error('Something went wrong');
			const req = {
				body: { ids: [1, 2, 3] },
			} as unknown as TypedRequest<{}, {}, { ids: number[] }>;
			(ordersService.printOrderItems as jest.Mock).mockRejectedValue(error);

			await ordersController.orderItemsPrint(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('orderItemsCall', () => {
		it('should call order items successfully', async () => {
			const mockCalledItems = [{ id: 1, name: 'Pizza' }];
			const req = {
				body: { ids: [1, 2, 3] },
			} as unknown as TypedRequest<{}, {}, { ids: number[] }>;
			jest.spyOn(ordersService, 'callOrderItems').mockResolvedValue(mockCalledItems.toString());
			const okSpy = jest
				.spyOn(ordersController, 'ok')
				.mockImplementation((res: Response, data: any) => {
					return res.status(200).json(data);
				});

			await ordersController.orderItemsCall(req, res as Response, next);

			expect(ordersService.callOrderItems).toHaveBeenCalledWith(req.body.ids);
			expect(okSpy).toHaveBeenCalled();
		});

		it('should handle errors', async () => {
			const error = new Error('Something went wrong');
			const req = {
				body: { ids: [1, 2, 3] },
			} as unknown as TypedRequest<{}, {}, { ids: number[] }>;
			(ordersService.callOrderItems as jest.Mock).mockRejectedValue(error);

			await ordersController.orderItemsCall(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('deleteOrder', () => {
		it('should delete order successfully', async () => {
			const req = {
				params: { id: '1' },
			} as unknown as TypedRequest<{ id: number }, {}, {}>;
			jest.spyOn(ordersService, 'delete').mockResolvedValue(true);
			const okSpy = jest
				.spyOn(ordersController, 'ok')
				.mockImplementation((res: Response, message: any) => {
					return res.status(200).json({ message });
				});

			await ordersController.deleteOrder(req, res as Response, next);

			expect(ordersService.delete).toHaveBeenCalledWith(1);
			expect(okSpy).toHaveBeenCalledWith(res, 'Order with id 1 deleted successfully');
		});

		it('should handle errors', async () => {
			const error = new Error('Something went wrong');
			const req = {
				params: { id: '1' },
			} as unknown as TypedRequest<{ id: number }, {}, {}>;
			(ordersService.delete as jest.Mock).mockRejectedValue(error);

			await ordersController.deleteOrder(req, res as Response, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
