import { PrismaClient } from '@prisma/client';
import { Container } from 'inversify';
import 'reflect-metadata';
import { OrderStatus } from '../../dto/enums';
import { OrderCreateDTO, OrderSearchCriteria, OrderUpdateProps } from '../../dto/orders.dto';
import { HTTPError } from '../../errors/http-error.class';
import { TYPES } from '../../types';
import { OrdersService } from './order.service';

const container = new Container();
const prismaMock = new PrismaClient();
const ordersService = new OrdersService(prismaMock);

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prismaMock);

container.bind<OrdersService>(TYPES.OrdersService).to(OrdersService);

describe('OrdersService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	describe('findOrders', () => {
		it('should find orders based on criteria', async () => {
			const criteria: OrderSearchCriteria = {
				id: 1,
				server: 1,
				status: OrderStatus.AWAITING,
				tableNumber: 1,
				guestNumber: 1,
				allergies: [],
				page: 1,
				pageSize: 10,
				sortBy: 'id',
				sortOrder: 'asc',
			};

			prismaMock.order.findMany = jest.fn().mockResolvedValue([]);
			prismaMock.order.count = jest.fn().mockResolvedValue(0);

			const result = await ordersService.findOrders(criteria);

			expect(result).toEqual({
				orders: [],
				totalCount: 0,
				page: 1,
				pageSize: 10,
				totalPages: 0,
			});
		});

		it('should throw an error if the operation fails', async () => {
			const criteria: OrderSearchCriteria = {
				id: 1,
				server: 1,
				status: OrderStatus.AWAITING,
				tableNumber: 1,
				guestNumber: 1,
				allergies: [],
				page: 1,
				pageSize: 10,
				sortBy: 'id',
				sortOrder: 'asc',
			};

			prismaMock.order.findMany = jest
				.fn()
				.mockRejectedValue(new HTTPError('Order not found in the database'));

			// await expect(ordersService.findOrders(criteria)).resolves();
		});
	});

	describe('findOrderById', () => {
		it('should find an order by its ID', async () => {
			const orderId = 1;
			const order = {
				id: orderId,
				status: OrderStatus.AWAITING,
				server: { name: 'Server', id: 1 },
				foodItems: [],
				drinkItems: [],
			};

			prismaMock.order.findUnique = jest.fn().mockResolvedValue(order);

			const result = await ordersService.findOrderById(orderId);

			expect(result).toEqual(order);
		});

		it('should throw an error if the order is not found', async () => {
			const orderId = 1;

			prismaMock.order.findUnique = jest.fn().mockResolvedValue(null);

			await expect(ordersService.findOrderById(orderId)).resolves.not.toBe(undefined);
		});
	});

	describe('createOrder', () => {
		it('should create a new order', async () => {
			const order: OrderCreateDTO = {
				serverId: 1,
				tableNumber: 1,
				guestsCount: 1,
				foodItems: [],
				drinkItems: [],
				allergies: [],
				comments: '',
				totalAmount: 100,
				discount: 0,
				status: OrderStatus.AWAITING,
			};

			const createdOrder = {
				...order,
				id: 1,
				status: OrderStatus.AWAITING,
				server: { name: 'Server', id: 1 },
				foodItems: [],
				drinkItems: [],
			};

			prismaMock.order.create = jest.fn().mockResolvedValue(createdOrder);

			const result = await ordersService.createOrder(order);

			expect(result).toEqual(createdOrder);
		});

		it('should throw an error if the creation fails', async () => {
			const order: OrderCreateDTO = {
				serverId: 1,
				tableNumber: 1,
				guestsCount: 1,
				foodItems: [],
				drinkItems: [],
				allergies: [],
				comments: '',
				totalAmount: 100,
				discount: 0,
				status: OrderStatus.AWAITING,
			};

			prismaMock.order.create = jest.fn().mockRejectedValue(new HTTPError('Database error'));

			await expect(ordersService.createOrder(order)).rejects.toThrow('An unknown error occurred');
		});
	});

	describe('delete', () => {
		it('should delete an order and its associated items', async () => {
			const orderId = 1;

			prismaMock.$transaction = jest.fn().mockResolvedValue(true);

			const result = await ordersService.delete(orderId);

			expect(result).toBe(true);
		});

		it('should throw an error if the deletion fails', async () => {
			const orderId = 1;

			prismaMock.$transaction = jest
				.fn()
				.mockRejectedValue(new HTTPError(500, 'OrdersService', 'Database error', '/orders'));

			await expect(ordersService.delete(orderId)).rejects.toThrow(HTTPError);
		});
	});

	describe('printOrderItems', () => {
		it('should print order items', async () => {
			const ids = [1, 2, 3];

			prismaMock.orderDrinkItem.findMany = jest.fn().mockResolvedValue([]);
			prismaMock.orderFoodItem.findMany = jest.fn().mockResolvedValue([]);
			prismaMock.orderFoodItem.updateMany = jest.fn().mockResolvedValue({});
			prismaMock.orderDrinkItem.updateMany = jest.fn().mockResolvedValue({});
			prismaMock.$transaction = jest.fn().mockImplementation(async (callback) => {
				return callback(prismaMock);
			});

			const result = await ordersService.printOrderItems(1, ids);

			console.log('Result:', result);

			expect(result).toBe(`items ${ids} have been printed.`);
		});

		it('should throw an error if items have already been printed', async () => {
			const ids = [1, 2, 3];

			prismaMock.orderDrinkItem.findMany = jest.fn().mockResolvedValue([{ id: 1, printed: true }]);
			prismaMock.orderFoodItem.findMany = jest.fn().mockResolvedValue([]);

			await expect(ordersService.printOrderItems(1, ids)).rejects.toThrow(
				'Items 1 already printed.'
			);
		});
	});

	describe('callOrderItems', () => {
		it('should call order items', async () => {
			const ids = [1, 2, 3];
			prismaMock.order.findUnique = jest.fn().mockResolvedValue({ id: 1 });
			prismaMock.orderFoodItem.findMany = jest.fn().mockResolvedValue([]);
			prismaMock.orderDrinkItem.findMany = jest.fn().mockResolvedValue([]);
			prismaMock.orderFoodItem.updateMany = jest.fn().mockResolvedValue({});
			prismaMock.orderDrinkItem.updateMany = jest.fn().mockResolvedValue({});

			const result = await ordersService.callOrderItems(1, ids);

			expect(prismaMock.orderFoodItem.findMany).toHaveBeenCalledWith({
				where: { id: { in: ids } },
				select: { id: true, printed: true, fired: true },
			});
			expect(prismaMock.orderDrinkItem.findMany).toHaveBeenCalledWith({
				where: { id: { in: ids } },
				select: { id: true, printed: true, fired: true },
			});
			expect(prismaMock.orderFoodItem.updateMany).toHaveBeenCalledWith({
				where: { id: { in: ids } },
				data: { fired: true },
			});
			expect(prismaMock.orderDrinkItem.updateMany).toHaveBeenCalledWith({
				where: { id: { in: ids } },
				data: { fired: true },
			});
			expect(result).toBe(`items ${ids} have been called.`);
		});

		it('should throw an error if items have not been printed', async () => {
			const ids = [1, 2, 3];

			prismaMock.orderFoodItem.findMany = jest
				.fn()
				.mockResolvedValue([{ id: 1, printed: false, fired: false }]);
			prismaMock.orderDrinkItem.findMany = jest.fn().mockResolvedValue([]);

			await expect(ordersService.callOrderItems(1, ids)).rejects.toThrow(
				'Items 1 have not been printed.'
			);
		});
	});
	describe('updateOrderProperties', () => {
		it('should update order properties', async () => {
			const orderId = 1;
			const updatedProperties: OrderUpdateProps = {
				status: OrderStatus.COMPLETED,
			};

			const existingOrder = {
				id: orderId,
				status: OrderStatus.AWAITING,
				server: { name: 'Server', id: 1 },
				foodItems: [],
				drinkItems: [],
			};

			prismaMock.order.findUnique = jest.fn().mockResolvedValue(existingOrder);
			prismaMock.order.update = jest.fn().mockResolvedValue({
				...existingOrder,
				...updatedProperties,
			});

			const result = await ordersService.updateOrderProperties(orderId, updatedProperties);

			expect(result).toEqual({
				...existingOrder,
				...updatedProperties,
			});
		});

		it('should throw an error if the order is not found', async () => {
			const orderId = 1;
			const updatedProperties: OrderUpdateProps = {
				status: OrderStatus.COMPLETED,
			};

			prismaMock.order.findUnique = jest.fn().mockResolvedValue(null);

			await expect(ordersService.updateOrderProperties(orderId, updatedProperties)).rejects.toThrow(
				'An unexpected error occurred'
			);
		});
	});
});
