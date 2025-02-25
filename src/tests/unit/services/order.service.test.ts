import { OrderState, PaymentState, PrismaClient } from '@prisma/client';
import { OrderCreateDTO, OrderSearchCriteria, OrderUpdateProps } from '@servemate/dto';
import { Container } from 'inversify';
import 'reflect-metadata';
import { HTTPError } from '../../../errors/http-error.class';
import { ORDER_INCLUDE } from '../../../services/orders/abstract-order.service';
import { OrdersService } from '../../../services/orders/order.service';
import { TYPES } from '../../../types';

describe('OrderService', () => {
	let container: Container;
	let orderService: OrdersService;
	let mockPrisma: jest.Mocked<any>;

	beforeEach(() => {
		container = new Container();
		mockPrisma = {
			order: {
				findMany: jest.fn(),
				findUnique: jest.fn(),
				create: jest.fn(),
				delete: jest.fn(),
				update: jest.fn(),
				count: jest.fn(),
			},
			orderFoodItem: {
				findMany: jest.fn(),
				deleteMany: jest.fn(),
				updateMany: jest.fn(),
				createMany: jest.fn(),
			},
			orderDrinkItem: {
				findMany: jest.fn(),
				deleteMany: jest.fn(),
				updateMany: jest.fn(),
				createMany: jest.fn(),
			},
			foodItem: {
				findMany: jest.fn(),
			},
			drinkItem: {
				findMany: jest.fn(),
			},
			$transaction: jest.fn((callback) => callback(mockPrisma)),
		} as unknown as jest.Mocked<PrismaClient>;

		container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(mockPrisma);
		container.bind<OrdersService>(TYPES.OrdersService).to(OrdersService);

		orderService = container.get<OrdersService>(TYPES.OrdersService);
	});

	describe('findOrders', () => {
		const mockSearchCriteria: OrderSearchCriteria = {
			page: 1,
			pageSize: 10,
			sortBy: 'id',
			sortOrder: 'asc',
		};

		it('should return orders list successfully', async () => {
			const mockOrders = [
				{
					id: 1,
					status: OrderState.RECEIVED,
					server: { name: 'John', id: 1 },
					tableNumber: 1,
					guestsCount: 2,
					orderTime: new Date(),
					completionTime: null,
					updatedAt: new Date(),
					allergies: [],
					comments: '',
					totalAmount: 100,
					discount: 0,
					tip: 0,
				},
			];

			mockPrisma.order.findMany.mockResolvedValue(mockOrders);
			mockPrisma.order.count.mockResolvedValue(1);

			const result = await orderService.findOrders(mockSearchCriteria);

			expect(result.orders).toHaveLength(1);
			expect(result.totalCount).toBe(1);
			expect(result.page).toBe(1);
			expect(result.pageSize).toBe(10);
			expect(result.totalPages).toBe(1);
		});

		it('should handle empty results', async () => {
			mockPrisma.order.findMany.mockResolvedValue([]);
			mockPrisma.order.count.mockResolvedValue(0);

			const result = await orderService.findOrders(mockSearchCriteria);

			expect(result.orders).toHaveLength(0);
			expect(result.totalCount).toBe(0);
			expect(result.totalPages).toBe(0);
		});

		it('should handle database errors', async () => {
			mockPrisma.order.findMany.mockRejectedValue(new Error('Database error'));

			await expect(orderService.findOrders(mockSearchCriteria)).rejects.toThrow(HTTPError);
		});
	});

	describe('findOrderById', () => {
		it('should return order by id successfully', async () => {
			const mockOrder = {
				id: 1,
				status: OrderState.RECEIVED,
				foodItems: [],
				drinkItems: [],
				server: { name: 'John', id: 1 },
			};

			mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

			const result = await orderService.findOrderById(1);

			expect(result).toBeDefined();
			expect(result.id).toBe(1);
		});

		it('should throw error when order not found', async () => {
			mockPrisma.order.findUnique.mockResolvedValue(null);

			await expect(orderService.findOrderById(999)).rejects.toThrow(
				'Order not found in the database'
			);
		});
	});

	describe('createOrder', () => {
		const mockOrderData: OrderCreateDTO = {
			tableNumber: 107,
			serverId: 100004,
			guestsCount: 3,
			status: OrderState.SERVED,
			foodItems: [
				{
					guestNumber: 1,
					items: [
						{
							itemId: 1,
							price: 10,
							discount: 0,
							finalPrice: 10,
							specialRequest: null,
							allergies: [],
							printed: false,
							fired: false,
							paymentStatus: PaymentState.NONE,
						},
					],
				},
				{
					guestNumber: 1,
					items: [
						{
							itemId: 1,
							price: 10,
							discount: 0,
							finalPrice: 10,
							specialRequest: null,
							allergies: [],
							printed: false,
							fired: false,
							paymentStatus: PaymentState.NONE,
						},
					],
				},
				{
					guestNumber: 2,
					items: [
						{
							itemId: 2,
							price: 20,
							discount: 0,
							finalPrice: 20,
							specialRequest: null,
							allergies: [],
							printed: false,
							fired: false,
							paymentStatus: PaymentState.NONE,
						},
					],
				},
			],
			drinkItems: [],
			allergies: [],
			comments: 'Test order',
			totalAmount: 40, // Sum of all finalPrices: 10 + 10 + 20
			discount: 0,
		};

		beforeEach(() => {
			// Mock food item prices lookup
			mockPrisma.foodItem.findMany.mockResolvedValue([
				{ id: 1, price: 10, name: 'Caesar Salad' },
				{ id: 2, price: 20, name: 'Grilled Salmon' },
			]);

			// Mock drink item prices lookup
			mockPrisma.drinkItem.findMany.mockResolvedValue([]);
		});

		it('should create order successfully', async () => {
			const mockCreatedOrder = {
				id: 1,
				...mockOrderData,
				foodItems: mockOrderData.foodItems.flatMap((guest) =>
					guest.items.map((item) => ({
						id: Math.random(),
						orderId: 1,
						itemId: item.itemId,
						guestNumber: guest.guestNumber,
						price: item.price,
						discount: item.discount,
						finalPrice: item.finalPrice,
						specialRequest: item.specialRequest,
						allergies: item.allergies,
						printed: item.printed,
						fired: item.fired,
						paymentStatus: item.paymentStatus,
						foodItem: {
							id: item.itemId,
							name: item.itemId === 1 ? 'Caesar Salad' : 'Grilled Salmon',
						},
					}))
				),
				drinkItems: [],
				server: { id: mockOrderData.serverId, name: 'Test Server' },
				orderTime: new Date(),
				updatedAt: new Date(),
			};

			mockPrisma.order.create.mockResolvedValue(mockCreatedOrder);

			const result = await orderService.createOrder(mockOrderData);

			expect(result).toBeDefined();
			expect(result.tableNumber).toBe(mockOrderData.tableNumber);
			expect(result.foodItems).toBeDefined();
			expect(Array.isArray(result.foodItems)).toBe(true);
			// Verify items are grouped by guest
			expect(result.foodItems.length).toBeLessThanOrEqual(mockOrderData.foodItems.length);
			// Verify food items were looked up for price validation
			expect(mockPrisma.foodItem.findMany).toHaveBeenCalled();
		});

		it('should handle database errors during creation', async () => {
			mockPrisma.order.create.mockRejectedValue(new Error('Creation failed'));

			await expect(orderService.createOrder(mockOrderData)).rejects.toThrow(HTTPError);
		});

		it('should validate and correct item prices', async () => {
			const modifiedOrder = {
				...mockOrderData,
				foodItems: [
					{
						guestNumber: 1,
						items: [
							{
								itemId: 1,
								price: 15, // Different from DB price
								discount: 0,
								finalPrice: 15,
								specialRequest: null,
								allergies: [],
								printed: false,
								fired: false,
								paymentStatus: PaymentState.NONE,
							},
						],
					},
				],
			};

			const mockCreatedOrder = {
				id: 1,
				...modifiedOrder,
				foodItems: [
					{
						id: 1,
						orderId: 1,
						itemId: 1,
						guestNumber: 1,
						price: 10, // Should be corrected to DB price
						discount: 0,
						finalPrice: 10,
						specialRequest: null,
						allergies: [],
						printed: false,
						fired: false,
						paymentStatus: PaymentState.NONE,
						foodItem: { id: 1, name: 'Caesar Salad' },
					},
				],
				drinkItems: [],
				server: { id: modifiedOrder.serverId, name: 'Test Server' },
				orderTime: new Date(),
				updatedAt: new Date(),
			};

			mockPrisma.order.create.mockResolvedValue(mockCreatedOrder);

			const result = await orderService.createOrder(modifiedOrder);

			expect(result.foodItems[0].items[0].price).toBe(10); // Should be corrected to DB price
			expect(result.foodItems[0].items[0].finalPrice).toBe(10); // Should be corrected to DB price
		});
	});

	describe('delete', () => {
		it('should delete order and related items successfully', async () => {
			mockPrisma.orderFoodItem.deleteMany.mockResolvedValue({ count: 1 });
			mockPrisma.orderDrinkItem.deleteMany.mockResolvedValue({ count: 1 });
			mockPrisma.order.delete.mockResolvedValue({ id: 1 });

			await expect(orderService.delete(1)).resolves.not.toThrow();

			expect(mockPrisma.orderFoodItem.deleteMany).toHaveBeenCalledWith({
				where: { orderId: 1 },
			});
			expect(mockPrisma.orderDrinkItem.deleteMany).toHaveBeenCalledWith({
				where: { orderId: 1 },
			});
			expect(mockPrisma.order.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			});
		});

		it('should handle database errors during deletion', async () => {
			mockPrisma.orderFoodItem.deleteMany.mockRejectedValue(new Error('Deletion failed'));

			await expect(orderService.delete(1)).rejects.toThrow(HTTPError);
		});
	});

	describe('printOrderItems', () => {
		const orderId = 1;
		const itemIds = [1, 2];

		it('should print order items successfully', async () => {
			mockPrisma.orderDrinkItem.findMany.mockResolvedValue([{ id: 1, printed: false }]);
			mockPrisma.orderFoodItem.findMany.mockResolvedValue([
				{ id: 2, printed: false, fired: false },
			]);

			mockPrisma.orderFoodItem.updateMany.mockResolvedValue({ count: 1 });
			mockPrisma.orderDrinkItem.updateMany.mockResolvedValue({ count: 1 });

			const result = await orderService.printOrderItems(orderId, itemIds);

			expect(result).toBe('Items have been ptinted');
			expect(mockPrisma.orderFoodItem.updateMany).toHaveBeenCalledWith({
				where: { id: { in: itemIds } },
				data: { printed: true },
			});
			expect(mockPrisma.orderDrinkItem.updateMany).toHaveBeenCalledWith({
				where: { id: { in: itemIds } },
				data: { printed: true },
			});
		});

		it('should throw error if items already printed', async () => {
			mockPrisma.orderDrinkItem.findMany.mockResolvedValue([{ id: 1, printed: true }]);
			mockPrisma.orderFoodItem.findMany.mockResolvedValue([{ id: 2, printed: true, fired: false }]);

			await expect(orderService.printOrderItems(orderId, itemIds)).rejects.toThrow(
				'Items have already been printed'
			);
		});
	});

	describe('callOrderItems', () => {
		const orderId = 1;
		const itemIds = [1, 2];

		it('should call order items successfully', async () => {
			mockPrisma.order.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.orderFoodItem.findMany.mockResolvedValue([{ id: 1, printed: true, fired: false }]);
			mockPrisma.orderDrinkItem.findMany.mockResolvedValue([
				{ id: 2, printed: true, fired: false },
			]);

			mockPrisma.orderFoodItem.updateMany.mockResolvedValue({ count: 1 });
			mockPrisma.orderDrinkItem.updateMany.mockResolvedValue({ count: 1 });

			const result = await orderService.callOrderItems(orderId, itemIds);

			expect(result).toBe(`items ${itemIds} have been called.`);
			expect(mockPrisma.orderFoodItem.updateMany).toHaveBeenCalledWith({
				where: { id: { in: itemIds } },
				data: { fired: true },
			});
		});

		it('should throw error if order not found', async () => {
			mockPrisma.order.findUnique.mockResolvedValue(null);

			await expect(orderService.callOrderItems(orderId, itemIds)).rejects.toThrow(
				`Order with ID ${orderId} not found in the database`
			);
		});

		it('should throw error if items not printed', async () => {
			mockPrisma.order.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.orderFoodItem.findMany.mockResolvedValue([
				{ id: 1, printed: false, fired: false },
			]);
			mockPrisma.orderDrinkItem.findMany.mockResolvedValue([]);

			await expect(orderService.callOrderItems(orderId, itemIds)).rejects.toThrow(
				'have not been printed'
			);
		});

		it('should throw error if items already fired', async () => {
			mockPrisma.order.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.orderFoodItem.findMany.mockResolvedValue([{ id: 1, printed: true, fired: true }]);
			mockPrisma.orderDrinkItem.findMany.mockResolvedValue([]);

			await expect(orderService.callOrderItems(orderId, itemIds)).rejects.toThrow(
				'have been fired'
			);
		});
	});

	describe('updateOrderProperties', () => {
		const orderId = 1;
		const updateProps: OrderUpdateProps = {
			status: OrderState.COMPLETED,
			comments: 'Updated comments',
		};

		it('should update order properties successfully', async () => {
			const mockUpdatedOrder = {
				id: orderId,
				tableNumber: 1,
				orderNumber: 1,
				guestsCount: 2,
				orderTime: new Date(),
				updatedAt: new Date(),
				allergies: [],
				serverId: 1,
				totalAmount: 15, // Sum of food and drink items
				status: OrderState.COMPLETED,
				comments: 'Updated comments',
				completionTime: new Date(),
				discount: 0,
				tip: 0,
				shiftId: null,
				foodItems: [
					{
						id: 1,
						itemId: 1,
						foodItem: { id: 1, name: 'Test Food' },
						guestNumber: 1,
						price: 10,
						discount: 0,
						finalPrice: 10,
						specialRequest: null,
						allergies: [],
						printed: false,
						fired: false,
						paymentStatus: PaymentState.NONE,
					},
				],
				drinkItems: [
					{
						id: 2,
						itemId: 2,
						drinkItem: { id: 2, name: 'Test Drink' },
						guestNumber: 1,
						price: 5,
						discount: 0,
						finalPrice: 5,
						specialRequest: null,
						allergies: [],
						printed: false,
						fired: false,
						paymentStatus: PaymentState.NONE,
					},
				],
				server: { id: 1, name: 'Test Server' },
			};

			mockPrisma.order.update.mockResolvedValue(mockUpdatedOrder);

			const result = await orderService.updateOrderProperties(orderId, updateProps);

			expect(result).toBeDefined();
			expect(result.status).toBe(OrderState.COMPLETED);
			expect(result.comments).toBe(updateProps.comments);
			expect(result.foodItems).toBeDefined();
			expect(result.drinkItems).toBeDefined();
			expect(mockPrisma.order.update).toHaveBeenCalledWith({
				where: { id: orderId },
				data: {
					...updateProps,
					completionTime: expect.any(Date),
				},
				include: expect.any(Object),
			});
		});

		it('should handle database errors during update', async () => {
			mockPrisma.order.update.mockRejectedValue(new Error('Update failed'));

			await expect(orderService.updateOrderProperties(orderId, updateProps)).rejects.toThrow(
				HTTPError
			);
		});
	});

	describe('updateOrderItemsInDatabase', () => {
		it('should update order items successfully', async () => {
			const orderId = 1;
			const updatedData = {
				foodItems: [
					{
						itemId: 1,
						guestNumber: 1,
						price: 10,
						discount: 0,
						finalPrice: 10,
						specialRequest: null,
						allergies: [],
						printed: false,
						fired: false,
					},
				],
				drinkItems: [
					{
						itemId: 2,
						guestNumber: 1,
						price: 5,
						discount: 0,
						finalPrice: 5,
						specialRequest: null,
						allergies: [],
						printed: false,
						fired: false,
					},
				],
				totalAmount: 15,
			};

			const mockUpdatedOrder = {
				id: orderId,
				status: OrderState.RECEIVED,
				foodItems: updatedData.foodItems,
				drinkItems: updatedData.drinkItems,
				totalAmount: updatedData.totalAmount,
				server: { name: 'John', id: 1 },
			};

			mockPrisma.order.update.mockResolvedValue(mockUpdatedOrder);

			const result = await orderService.updateOrderItemsInDatabase(orderId, updatedData);

			expect(result).toBeDefined();
			expect(result.id).toBe(orderId);
			expect(result.totalAmount).toBe(updatedData.totalAmount);
			expect(mockPrisma.order.update).toHaveBeenCalledWith({
				where: { id: orderId },
				data: {
					totalAmount: updatedData.totalAmount,
					foodItems: {
						deleteMany: {},
						createMany: {
							data: updatedData.foodItems,
						},
					},
					drinkItems: {
						deleteMany: {},
						createMany: {
							data: updatedData.drinkItems,
						},
					},
				},
				include: ORDER_INCLUDE,
			});
		});

		it('should handle database errors during update', async () => {
			mockPrisma.order.update.mockRejectedValue(new Error('Update failed'));

			await expect(
				orderService.updateOrderItemsInDatabase(1, {
					foodItems: [],
					drinkItems: [],
					totalAmount: 0,
				})
			).rejects.toThrow(HTTPError);
		});
	});

	describe('updateItemsInOrder', () => {
		const orderId = 1;
		const updatedItems = {
			foodItems: [
				{
					guestNumber: 1,
					items: [
						{
							itemId: 1,
							price: 10,
							discount: 0,
							finalPrice: 10,
							specialRequest: null,
							allergies: [],
							printed: false,
							fired: false,
							paymentStatus: PaymentState.NONE,
						},
					],
				},
			],
			drinkItems: [
				{
					guestNumber: 1,
					items: [
						{
							itemId: 2,
							price: 5,
							discount: 0,
							finalPrice: 5,
							specialRequest: null,
							allergies: [],
							printed: false,
							fired: false,
							paymentStatus: PaymentState.NONE,
						},
					],
				},
			],
		};

		beforeEach(() => {
			// Mock findOrderById
			mockPrisma.order.findUnique.mockResolvedValue({
				id: orderId,
				status: OrderState.RECEIVED,
				foodItems: [],
				drinkItems: [],
				server: { name: 'John', id: 1 },
			});

			// Mock food and drink item price validation
			mockPrisma.foodItem.findMany.mockResolvedValue([{ id: 1, price: 10, name: 'Test Food' }]);
			mockPrisma.drinkItem.findMany.mockResolvedValue([{ id: 2, price: 5, name: 'Test Drink' }]);

			// Mock the update
			mockPrisma.order.update.mockResolvedValue({
				id: orderId,
				status: OrderState.RECEIVED,
				foodItems: updatedItems.foodItems,
				drinkItems: updatedItems.drinkItems,
				totalAmount: 15,
				server: { name: 'John', id: 1 },
			});
		});

		it('should update order items successfully', async () => {
			const result = await orderService.updateItemsInOrder(orderId, updatedItems);

			expect(result).toBeDefined();
			expect(mockPrisma.order.findUnique).toHaveBeenCalled();
			expect(mockPrisma.order.update).toHaveBeenCalled();
			expect(mockPrisma.foodItem.findMany).toHaveBeenCalled();
			expect(mockPrisma.drinkItem.findMany).toHaveBeenCalled();
		});

		it('should handle non-existent order', async () => {
			mockPrisma.order.findUnique.mockResolvedValue(null);

			await expect(orderService.updateItemsInOrder(999, updatedItems)).rejects.toThrow(
				'Order not found in the database'
			);
		});

		it('should handle database errors during update', async () => {
			mockPrisma.order.update.mockRejectedValue(new Error('Update failed'));

			await expect(orderService.updateItemsInOrder(orderId, updatedItems)).rejects.toThrow(
				HTTPError
			);
		});
	});
});
