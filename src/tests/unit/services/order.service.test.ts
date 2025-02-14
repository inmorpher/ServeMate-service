import 'reflect-metadata';
import { Prisma, PrismaClient } from '@prisma/client';
import { OrdersService } from '../../../services/orders/order.service';
import { OrderState, PaymentState } from '../../../dto/enums';
import { HTTPError } from '../../../errors/http-error.class';
import { OrderCreateDTO, OrderUpdateProps } from '../../../dto/orders.dto';
import { FlattenedDrinkItem, FlattenedFoodItem, ORDER_INCLUDE } from '../../../services/orders/abstract-order.service';

// Mock PrismaClient
const prisma = new PrismaClient();
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        order: {
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        orderFoodItem: {
            findMany: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        orderDrinkItem: {
            findMany: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(prisma)),
    })),
}));

describe('OrdersService', () => {
    let service: OrdersService;
    let prisma: jest.Mocked<PrismaClient>;

    beforeEach(() => {
        prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
        service = new OrdersService(prisma);
    });

    describe('findOrders', () => {
        const mockCriteria = {
            page: 1,
            pageSize: 10,
            sortBy: 'orderTime',
            sortOrder: 'desc' as const,
            serverName: 'John'
        };

        const mockOrders = [
            {
                id: 1,
                status: OrderState.AWAITING,
                server: { name: 'John', id: 1 },
                tableNumber: 1,
                guestsCount: 2,
                orderTime: new Date(),
                completionTime: null,
                updatedAt: new Date(),
                allergies: ['PEANUT'],
                comments: 'test comment',
                totalAmount: 100,
                discount: 0,
                tip: 10,
            },
        ];

        it('should successfully find orders', async () => {
            (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
            (prisma.order.count as jest.Mock).mockResolvedValue(1);

            const result = await service.findOrders(mockCriteria);

            expect(result).toEqual({
                orders: mockOrders,
                totalCount: 1,
                page: 1,
                pageSize: 10,
                totalPages: 1,
            });

            expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    server: {
                        name: {
                            contains: 'John',
                            mode: 'insensitive',
                        },
                    },
                }),
            }));
        });

        it('should handle database errors when finding orders', async () => {
            const error = new Error('Database error');
            (prisma.order.findMany as jest.Mock).mockRejectedValue(error);

            await expect(service.findOrders(mockCriteria)).rejects.toThrow();
        });
    });

    describe('findOrderById', () => {
        const mockOrder = {
            id: 1,
            status: OrderState.AWAITING,
            foodItems: [
                {
                    id: 1,
                    itemId: 1,
                    foodItem: { name: 'Burger', id: 1 },
                    guestNumber: 1,
                    price: 10,
                    discount: 0,
                    finalPrice: 10,
                    specialRequest: null,
                    allergies: [],
                    printed: false,
                    fired: false,
                    paymentStatus: PaymentState.NONE
                },
                {
                    id: 2,
                    itemId: 1,
                    foodItem: { name: 'Burger', id: 1 },
                    guestNumber: 1,
                    price: 10,
                    discount: 0,
                    finalPrice: 10,
                    specialRequest: null,
                    allergies: [],
                    printed: false,
                    fired: false,
                    paymentStatus: PaymentState.NONE
                }
            ],
            drinkItems: [
                {
                    id: 3,
                    itemId: 2,
                    drinkItem: { name: 'Cola', id: 2 },
                    guestNumber: 1,
                    price: 5,
                    discount: 0,
                    finalPrice: 5,
                    specialRequest: null,
                    allergies: [],
                    printed: false,
                    fired: false,
                    paymentStatus: PaymentState.NONE
                }
            ],
        };

        it('should successfully find order by ID', async () => {
            (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

            const result = await service.findOrderById(1);

            // The result should be grouped by guest number
            expect(result).toEqual({
                ...mockOrder,
                foodItems: [{
                    guestNumber: 1,
                    items: [{
                        id: 1,
                        itemId: 1,
                        name: 'Burger',
                        allergies: [],
                        price: 10,
                        discount: 0,
                        finalPrice: 10,
                        printed: false,
                        fired: false,
                        guest: 1
                    },
                    {
                        id: 2,
                        itemId: 1,
                        name: 'Burger',
                        allergies: [],
                        price: 10,
                        discount: 0,
                        finalPrice: 10,
                        printed: false,
                        fired: false,
                        guest: 1
                    }]
                }],
                drinkItems: [{
                    guestNumber: 1,
                    items: [{
                        id: 3,
                        itemId: 2,
                        name: 'Cola',
                        allergies: [],
                        price: 5,
                        discount: 0,
                        finalPrice: 5,
                        printed: false,
                        fired: false,
                        guest: 1
                    }]
                }]
            });
        });

        it('should throw error when order not found', async () => {
            (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.findOrderById(1)).rejects.toThrow('Order not found in the database');
        });
    });

    describe('createOrder', () => {
        const mockOrderData: OrderCreateDTO = {
            tableNumber: 1,
            guestsCount: 2,
            serverId: 1,
            status: OrderState.AWAITING,
            totalAmount: 15,  // 10 + 5
            discount: 0,
            allergies: ['PEANUT'],
            comments: 'test comment',
            foodItems: [
                { 
                    guestNumber: 1, 
                    items: [{
                        itemId: 1,
                        price: 10,
                        discount: 0,
                        finalPrice: 10,
                        specialRequest: null,
                        allergies: [],
                        printed: false,
                        fired: false,
                        paymentStatus: PaymentState.NONE
                    }] 
                }
            ],
            drinkItems: [
                { 
                    guestNumber: 1, 
                    items: [{
                        itemId: 1,
                        price: 5,
                        discount: 0,
                        finalPrice: 5,
                        specialRequest: null,
                        allergies: [],
                        printed: false,
                        fired: false,
                        paymentStatus: PaymentState.NONE
                    }] 
                }
            ],
        };

        it('should successfully create an order', async () => {
            const mockCreatedOrder: {order: OrderCreateDTO & {
                flattenedFoodItems: FlattenedFoodItem[];
                flattenedDrinkItems: FlattenedDrinkItem[];
            }} = {
               
                ...mockOrderData,
             
                foodItems: [
                        {id: 1,
                        itemId: 1,
                        guestNumber: 1, 
                        price: 10,
                        discount: 0,
                        finalPrice: 10,
                        specialRequest: null,
                        allergies: [],
                        printed: false,
                        fired: false,
                        paymentStatus: PaymentState.NONE}
                    ]  as Prisma.OrderFoodItemCreateManyOrderInput[],
                drinkItems: [{ 
                    guestNumber: 1, 
                    items: [{
                        id: 2,
                        itemId: 1,
                        price: 5,
                        discount: 0,
                        finalPrice: 5,
                        specialRequest: null,
                        allergies: [],
                        printed: false,
                        fired: false,
                        paymentStatus: PaymentState.NONE
                    }] 
                }],
            };


            (prisma.order.create as jest.Mock).mockResolvedValue(mockCreatedOrder);

            const result = await service.createOrder(mockOrderData);

            expect(result).toEqual(mockCreatedOrder);
        });

        it('should handle errors during order creation', async () => {
            const error = new Error('Creation failed');
            (prisma.order.create as jest.Mock).mockRejectedValue(error);

            await expect(service.createOrder(mockOrderData)).rejects.toThrow();
        });
    });

    describe('printOrderItems', () => {
        const mockItems = [
            { printed: false },
            { printed: false },
        ];

        it('should successfully print order items', async () => {
            const mockTransactionImplementation = async (callback: any) => {
                const transactionPrisma = {
                    orderDrinkItem: {
                        findMany: jest.fn().mockResolvedValue([mockItems[0]]),
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                    },
                    orderFoodItem: {
                        findMany: jest.fn().mockResolvedValue([mockItems[1]]),
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                    },
                };
                return callback(transactionPrisma);
            };

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransactionImplementation);

            const result = await service.printOrderItems(1, [1, 2]);
            expect(result).toContain('Items have been ptinted');
        });

        it('should throw error when items already printed', async () => {
            const mockTransactionImplementation = async (callback: any) => {
                const transactionPrisma = {
                    orderDrinkItem: {
                        findMany: jest.fn().mockResolvedValue([{ printed: true }]),
                    },
                    orderFoodItem: {
                        findMany: jest.fn().mockResolvedValue([{ printed: true }]),
                    },
                };
                return callback(transactionPrisma);
            };

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransactionImplementation);

            await expect(service.printOrderItems(1, [1, 2])).rejects.toThrow('Items have already been printed');
        });
    });

    describe('callOrderItems', () => {
        it('should successfully call order items', async () => {
            const mockTransactionImplementation = async (callback: any) => {
                const transactionPrisma = {
                    order: {
                        findUnique: jest.fn().mockResolvedValue({ id: 1 }),
                    },
                    orderDrinkItem: {
                        findMany: jest.fn().mockResolvedValue([{ printed: true, fired: false }]),
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                    },
                    orderFoodItem: {
                        findMany: jest.fn().mockResolvedValue([{ printed: true, fired: false }]),
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                    },
                };
                return callback(transactionPrisma);
            };

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransactionImplementation);

            const result = await service.callOrderItems(1, [1, 2]);
            expect(result).toContain('have been called');
        });

        it('should throw error when order not found', async () => {
            const mockTransactionImplementation = async (callback: any) => {
                const transactionPrisma = {
                    order: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                };
                return callback(transactionPrisma);
            };

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransactionImplementation);

            await expect(service.callOrderItems(1, [1, 2])).rejects.toThrow('Order with ID 1 not found in the database');
        });

        it('should throw error when items not printed', async () => {
            const mockTransactionImplementation = async (callback: any) => {
                const transactionPrisma = {
                    order: {
                        findUnique: jest.fn().mockResolvedValue({ id: 1 }),
                    },
                    orderDrinkItem: {
                        findMany: jest.fn().mockResolvedValue([{ printed: false, fired: false }]),
                    },
                    orderFoodItem: {
                        findMany: jest.fn().mockResolvedValue([]),
                    },
                };
                return callback(transactionPrisma);
            };

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransactionImplementation);

            await expect(service.callOrderItems(1, [1])).rejects.toThrow('have not been printed');
        });

        it('should throw error when items already fired', async () => {
            const mockTransactionImplementation = async (callback: any) => {
                const transactionPrisma = {
                    order: {
                        findUnique: jest.fn().mockResolvedValue({ id: 1 }),
                    },
                    orderDrinkItem: {
                        findMany: jest.fn().mockResolvedValue([{ printed: true, fired: true }]),
                    },
                    orderFoodItem: {
                        findMany: jest.fn().mockResolvedValue([]),
                    },
                };
                return callback(transactionPrisma);
            };

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransactionImplementation);

            await expect(service.callOrderItems(1, [1])).rejects.toThrow('have been fired');
        });
    });

    describe('updateOrderProperties', () => {
        it('should successfully update order properties', async () => {
            const updateProps: OrderUpdateProps = {
                status: OrderState.COMPLETED,
                allergies: ['SHELLFISH'],
                comments: 'Updated comment',
            };

            const mockUpdatedOrder = {
                id: 1,
                status: OrderState.COMPLETED,
                allergies: ['SHELLFISH'],
                comments: 'Updated comment',
                completionTime: new Date(),
                foodItems: [],
                drinkItems: [],
            };

            (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

            const result = await service.updateOrderProperties(1, updateProps);

            expect(prisma.order.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    ...updateProps,
                    completionTime: expect.any(Date),
                },
                include: ORDER_INCLUDE,
            });

            expect(result).toEqual(mockUpdatedOrder);
        });

        it('should throw error when order not found', async () => {
            const error = new Error('Record to update not found.');
            (error as any).code = 'P2025';  // Prisma not found error code
            (prisma.order.update as jest.Mock).mockRejectedValue(error);

            await expect(service.updateOrderProperties(1, { status: OrderState.COMPLETED }))
                .rejects.toThrow('Order not found in the database');
        });
    });

    describe('delete', () => {
        it('should successfully delete an order', async () => {
            const mockTransactionImplementation = async (callback: any) => {
                const transactionPrisma = {
                    orderFoodItem: {
                        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
                    },
                    orderDrinkItem: {
                        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
                    },
                    order: {
                        delete: jest.fn().mockResolvedValue({ id: 1 }),
                    },
                };
                return callback(transactionPrisma);
            };

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransactionImplementation);

            const result = await service.delete(1);
            expect(result).toBe(true);
        });

        it('should handle errors during deletion', async () => {
            const error = new Error('Deletion failed');
            (prisma.$transaction as jest.Mock).mockRejectedValue(error);

            await expect(service.delete(1)).rejects.toThrow();
        });
    });

    describe('updateItemsInOrder', () => {
        const mockExistingOrder = {
            id: 1,
            status: OrderState.AWAITING,
            server: { name: 'Test Server', id: 1 },
            tableNumber: 1,
            guestsCount: 2,
            orderTime: new Date(),
            updatedAt: new Date(),
            completionTime: null,
            totalAmount: 10,
            discount: 0,
            allergies: [],
            comments: '',
            foodItems: [{ 
                guestNumber: 1, 
                items: [{
                    id: 1,
                    itemId: 1,
                    name: 'Test Food',
                    price: 10,
                    discount: 0,
                    finalPrice: 10,
                    specialRequest: null,
                    allergies: [],
                    printed: false,
                    fired: false,
                    paymentStatus: PaymentState.NONE,
                    guest: 1
                }] 
            }],
            drinkItems: []
        };

        const mockUpdatedData: Pick<OrderCreateDTO, 'foodItems' | 'drinkItems'> = {
            foodItems: [{ 
                guestNumber: 1, 
                items: [{
                    itemId: 2,
                    price: 15,
                    discount: 0,
                    finalPrice: 15,
                    specialRequest: null,
                    allergies: [],
                    paymentStatus: PaymentState.NONE
                }] 
            }],
            drinkItems: []
        };

        const mockUpdatedOrder = {
            ...mockExistingOrder,
            totalAmount: 25,
            foodItems: [
                ...mockExistingOrder.foodItems,
                ...mockUpdatedData.foodItems
            ]
        };

        it('should successfully update order items', async () => {
            // Mock findUnique for the initial order lookup
            (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockExistingOrder);

            // Mock the transaction
            const mockTransactionImplementation = async (callback: any) => {
                const transactionPrisma = {
                    ...prisma,
                    order: {
                        ...prisma.order,
                        findUnique: jest.fn().mockResolvedValue(mockExistingOrder),
                        update: jest.fn().mockResolvedValue(mockUpdatedOrder)
                    }
                };
                return callback(transactionPrisma);
            };

            (prisma.$transaction as jest.Mock).mockImplementation(mockTransactionImplementation);

            const result = await service.updateItemsInOrder(1, mockUpdatedData);
            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.foodItems).toHaveLength(mockExistingOrder.foodItems.length + mockUpdatedData.foodItems.length);
        });

        it('should throw error when order not found', async () => {
            // Mock findUnique to return null
            (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.updateItemsInOrder(1, mockUpdatedData))
                .rejects.toThrow('Order not found in the database');
        });
    });
});