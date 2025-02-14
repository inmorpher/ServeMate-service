import { PrismaClient } from '@prisma/client';
import { OrderState, PaymentState, RefundState } from '../../../dto/enums';
import { PaymentSearchCriteria } from '../../../dto/payment.dto';
import { HTTPError } from '../../../errors/http-error.class';
import { PaymentService } from '../../../services/payment/payment.service';

jest.mock('@opentelemetry/api', () => ({
    trace: {
        getTracer: () => ({ startSpan: jest.fn(), endSpan: jest.fn() }),
    },
}));

describe('PaymentService', () => {
    let paymentService: PaymentService;
    let mockPrisma: jest.Mocked<any>;

    beforeEach(() => {
        mockPrisma = {
            payment: {
                findMany: jest.fn(),
                count: jest.fn(),
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                update: jest.fn(),
                create: jest.fn(),
            },
            order: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            orderFoodItem: {
                updateMany: jest.fn(),
            },
            orderDrinkItem: {
                updateMany: jest.fn(),
            },
            refundPayment: {
                create: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(mockPrisma)),
        };

        paymentService = new PaymentService(mockPrisma as unknown as PrismaClient);
    });

    describe('findPayments', () => {
        const defaultCriteria: PaymentSearchCriteria = {
            page: 1,
            pageSize: 10,
            sortBy: 'id',
            sortOrder: 'asc',
        };

        it('should return paginated payments with total count', async () => {
            const mockPayments = [{ id: 1 }, { id: 2 }];
            mockPrisma.payment.findMany.mockResolvedValue(mockPayments);
            mockPrisma.payment.count.mockResolvedValue(2);

            const result = await paymentService.findPayments(defaultCriteria);

            expect(result).toEqual({
                payments: mockPayments,
                totalCount: 2,
                page: 1,
                pageSize: 10,
                totalPages: 1,
            });
            expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 0,
                    take: 10,
                    orderBy: { id: 'asc' },
                })
            );
        });

        it('should handle database errors', async () => {
            mockPrisma.payment.findMany.mockRejectedValue(new Error('Database error'));
            await expect(paymentService.findPayments(defaultCriteria)).rejects.toThrow(HTTPError);
        });
    });

    describe('findPaymentById', () => {
        it('should return payment when found', async () => {
            const mockPayment = { id: 1, amount: 100 };
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

            const result = await paymentService.findPaymentById(1);
            expect(result).toEqual(mockPayment);
        });

        it('should throw HTTPError when payment not found', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(null);
            await expect(paymentService.findPaymentById(1)).rejects.toThrow(HTTPError);
        });
    });

    describe('createPayment', () => {
        const mockOrder = {
            id: 1,
            status: OrderState.RECEIVED,
            foodItems: [
                { id: 101, finalPrice: 50, paymentStatus: PaymentState.NONE, isProcessed: false },
                { id: 102, finalPrice: 30, paymentStatus: PaymentState.NONE, isProcessed: false },
            ],
            drinkItems: [
                { id: 201, finalPrice: 20, paymentStatus: PaymentState.NONE, isProcessed: false },
            ],
        };

        beforeEach(() => {
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            mockPrisma.payment.create.mockResolvedValue({ id: 1 });
            mockPrisma.orderFoodItem.updateMany.mockResolvedValue({ count: 2 });
            mockPrisma.orderDrinkItem.updateMany.mockResolvedValue({ count: 1 });
        });

        it('should create payment successfully', async () => {
            // Mock calculatePaymentAmount and calculateTaxAndCharges
            jest.spyOn(paymentService as any, 'calculatePaymentAmount').mockReturnValue(100);
            jest.spyOn(paymentService as any, 'calculateTaxAndCharges').mockReturnValue({
                tax: 10,
                serviceCharge: 5,
                total: 115
            });

            const result = await paymentService.createPayment(1, [201], [101, 102]);
            expect(result).toMatch(/created successfully/);
            expect(mockPrisma.payment.create).toHaveBeenCalledWith({
                data: {
                    amount: 100,
                    tip: 0,
                    tax: 10,
                    serviceCharge: 5,
                    totalAmount: 115,
                    status: PaymentState.PENDING,
                    order: {
                        connect: { id: 1 }
                    },
                    orderDrinkItems: {
                        connect: [{ id: 201 }]
                    },
                    orderFoodItems: {
                        connect: [{ id: 101 }, { id: 102 }]
                    }
                }
            });
            expect(mockPrisma.orderFoodItem.updateMany).toHaveBeenCalledWith({
                where: { id: { in: [101, 102] } },
                data: { paymentStatus: PaymentState.PENDING }
            });
            expect(mockPrisma.orderDrinkItem.updateMany).toHaveBeenCalledWith({
                where: { id: { in: [201] } },
                data: { paymentStatus: PaymentState.PENDING }
            });
        });

        it('should throw error when trying to add processed items', async () => {
            const mockOrderWithProcessedItems = {
                ...mockOrder,
                foodItems: [
                    { id: 101, finalPrice: 50, paymentStatus: PaymentState.PENDING, isProcessed: true },
                ],
                drinkItems: [
                    { id: 201, finalPrice: 20, paymentStatus: PaymentState.PENDING, isProcessed: false },
                ],
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrderWithProcessedItems);
            
            await expect(paymentService.createPayment(1, [201], [101]))
                .rejects.toThrow('Invalid items selected or cannot add processed items to another payment');
        });

        it('should throw error when order not found', async () => {
            mockPrisma.order.findUnique.mockResolvedValue(null);
            await expect(paymentService.createPayment(1, [201], [101])).rejects.toThrow('Order not found');
        });

        it('should throw error when order is completed', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                ...mockOrder,
                status: OrderState.COMPLETED,
            });
            await expect(paymentService.createPayment(1, [201], [101])).rejects.toThrow('Order already completed');
        });

        it('should throw error when payment creation fails', async () => {
            mockPrisma.payment.create.mockResolvedValue(null);
            await expect(paymentService.createPayment(1, [201], [101])).rejects.toThrow('Payment creation failed');
        });

        it('should handle empty item arrays', async () => {
            jest.spyOn(paymentService as any, 'calculatePaymentAmount').mockReturnValue(0);
            jest.spyOn(paymentService as any, 'calculateTaxAndCharges').mockReturnValue({
                tax: 0,
                serviceCharge: 0,
                total: 0
            });
            
            const result = await paymentService.createPayment(1, [], []);
            expect(result).toMatch(/created successfully/);
            expect(mockPrisma.payment.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        amount: 0,
                        tax: 0,
                        serviceCharge: 0,
                        totalAmount: 0,
                        orderDrinkItems: { connect: [] },
                        orderFoodItems: { connect: [] }
                    })
                })
            );
        });

        it('should handle update failure for order items', async () => {
            mockPrisma.orderFoodItem.updateMany.mockResolvedValue({ count: 0 });
            mockPrisma.orderDrinkItem.updateMany.mockResolvedValue({ count: 0 });
            await expect(paymentService.createPayment(1, [201], [101])).rejects.toThrow('Failed to update order items status');
        });
    });

    describe('completePayment', () => {
        const mockPayment = {
            id: 1,
            orderId: 1,
            status: PaymentState.PENDING,
            orderFoodItems: [{ id: 101 }],
            orderDrinkItems: [{ id: 201 }],
            order: { id: 1, status: OrderState.RECEIVED },
        };

        beforeEach(() => {
            mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
            mockPrisma.payment.update.mockResolvedValue({ id: 1 });
            mockPrisma.orderFoodItem.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.orderDrinkItem.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.order.update.mockResolvedValue({ id: 1 });
        });

        it('should complete payment successfully', async () => {
            jest.spyOn(paymentService as any, 'checkOrderPaymentCompletion').mockResolvedValue(true);
            const result = await paymentService.completePayment(1);
            expect(result).toMatch(/completed successfully/);
        });

        it('should throw error when payment not found', async () => {
            mockPrisma.payment.findFirst.mockResolvedValue(null);
            await expect(paymentService.completePayment(1)).rejects.toThrow('Payment not found');
        });

        it('should throw error when order already completed', async () => {
            mockPrisma.payment.findFirst.mockResolvedValue({
                ...mockPayment,
                order: { id: 1, status: OrderState.COMPLETED },
            });
            await expect(paymentService.completePayment(1)).rejects.toThrow('Order already completed');
        });

        it('should not update order status when not all items are paid', async () => {
            jest.spyOn(paymentService as any, 'checkOrderPaymentCompletion').mockResolvedValue(false);
            const result = await paymentService.completePayment(1);
            expect(result).toMatch(/completed successfully/);
            expect(mockPrisma.order.update).not.toHaveBeenCalled();
        });

        it('should handle database error during payment update', async () => {
            mockPrisma.payment.update.mockRejectedValue(new Error('Database error'));
            await expect(paymentService.completePayment(1)).rejects.toThrow(HTTPError);
        });

        it('should handle database error during order status check', async () => {
            jest.spyOn(paymentService as any, 'checkOrderPaymentCompletion')
                .mockRejectedValue(new Error('Database error'));
            await expect(paymentService.completePayment(1)).rejects.toThrow(HTTPError);
        });

        it('should throw error when order is not found for payment', async () => {
            mockPrisma.payment.findFirst.mockResolvedValue({
                ...mockPayment,
                order: null
            });
            await expect(paymentService.completePayment(1)).rejects.toThrow('Order not found');
        });

        it('should throw error when payment completion update fails', async () => {
            mockPrisma.payment.update.mockResolvedValue(null);
            mockPrisma.orderFoodItem.updateMany.mockResolvedValue(null);
            mockPrisma.orderDrinkItem.updateMany.mockResolvedValue(null);
            await expect(paymentService.completePayment(1)).rejects.toThrow('Payment completion failed');
        });

        it('should handle null order reference', async () => {
            mockPrisma.payment.findFirst.mockResolvedValue({
                ...mockPayment,
                order: null
            });
            await expect(paymentService.completePayment(1)).rejects.toThrow('Order not found');
        });

        it('should handle complete payment process failure', async () => {
            mockPrisma.payment.update.mockResolvedValue(null);
            mockPrisma.orderFoodItem.updateMany.mockResolvedValue(null);
            mockPrisma.orderDrinkItem.updateMany.mockResolvedValue(null);
            await expect(paymentService.completePayment(1)).rejects.toThrow('Payment completion failed');
        });
    });

    describe('refundPayment', () => {
        const mockPayment = {
            id: 1,
            orderId: 1,
            amount: 100,
            status: PaymentState.PAID,
            orderFoodItems: [{ id: 101 }],
            orderDrinkItems: [{ id: 201 }],
        };

        beforeEach(() => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            mockPrisma.refundPayment.create.mockResolvedValue({ id: 1 });
            mockPrisma.payment.update.mockResolvedValue({ id: 1 });
            mockPrisma.orderFoodItem.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.orderDrinkItem.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.order.update.mockResolvedValue({ id: 1 });
        });

        it('should refund payment successfully', async () => {
            const result = await paymentService.refundPayment(1, 'Customer request');
            expect(result).toMatch(/refunded successfully/);
            expect(mockPrisma.refundPayment.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        paymentId: 1,
                        reason: 'Customer request',
                        status: RefundState.COMPLETED,
                    }),
                })
            );
        });

        it('should throw error when payment not found', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(null);
            await expect(paymentService.refundPayment(1, 'Test')).rejects.toThrow('Payment not found');
        });

        it('should throw error when payment already refunded', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                status: PaymentState.REFUNDED,
            });
            await expect(paymentService.refundPayment(1, 'Test')).rejects.toThrow('Payment already refunded');
        });

        it('should throw error when refund reason is empty', async () => {
            await expect(paymentService.refundPayment(1, '')).rejects.toThrow('Refund reason cannot be empty');
            await expect(paymentService.refundPayment(1, '   ')).rejects.toThrow('Refund reason cannot be empty');
        });

        it('should handle database error during refund creation', async () => {
            mockPrisma.refundPayment.create.mockRejectedValue(new Error('Database error'));
            await expect(paymentService.refundPayment(1, 'Test reason')).rejects.toThrow(HTTPError);
        });

        it('should handle database error during payment status update', async () => {
            mockPrisma.payment.update.mockRejectedValue(new Error('Database error'));
            await expect(paymentService.refundPayment(1, 'Test reason')).rejects.toThrow(HTTPError);
        });

        it('should throw error when payment is already cancelled', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                status: PaymentState.CANCELLED
            });
            await expect(paymentService.refundPayment(1, 'Test')).rejects.toThrow('Payment is already cancelled and cannot be refunded');
        });

        it('should handle case when payment amount is null', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                amount: null
            });
            const result = await paymentService.refundPayment(1, 'Test reason');
            expect(mockPrisma.refundPayment.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        amount: 0
                    })
                })
            );
            expect(result).toMatch(/refunded successfully/);
        });

        it('should handle cancellation status during refund', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                status: PaymentState.CANCELLED
            });
            await expect(paymentService.refundPayment(1, 'Test')).rejects.toThrow('Payment is already cancelled and cannot be refunded');
        });
    });

    describe('cancelPayment', () => {
        const mockPayment = {
            id: 1,
            orderId: 1,
            status: PaymentState.PENDING,
            orderFoodItems: [{ id: 101 }],
            orderDrinkItems: [{ id: 201 }],
        };

        beforeEach(() => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            mockPrisma.payment.update.mockResolvedValue({ id: 1 });
            mockPrisma.orderFoodItem.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.orderDrinkItem.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.order.update.mockResolvedValue({ id: 1 });
        });

        it('should cancel payment successfully', async () => {
            const result = await paymentService.cancelPayment(1);
            expect(result).toMatch(/cancelled successfully/);
        });

        it('should throw error when payment not found', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(null);
            await expect(paymentService.cancelPayment(1)).rejects.toThrow('Payment not found');
        });

        it('should throw error when payment already cancelled', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                status: PaymentState.CANCELLED,
            });
            await expect(paymentService.cancelPayment(1)).rejects.toThrow('Payment already cancelled');
        });

        it('should throw error when payment already refunded', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                status: PaymentState.REFUNDED,
            });
            await expect(paymentService.cancelPayment(1)).rejects.toThrow('Payment is already refunded');
        });

        it('should throw error when payment is already paid', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                status: PaymentState.PAID,
            });
            await expect(paymentService.cancelPayment(1)).rejects.toThrow('Payment is already paid');
        });

        it('should handle database error during payment cancellation', async () => {
            mockPrisma.payment.update.mockRejectedValue(new Error('Database error'));
            await expect(paymentService.cancelPayment(1)).rejects.toThrow(HTTPError);
        });

        it('should handle database error during order items update', async () => {
            mockPrisma.orderFoodItem.updateMany.mockRejectedValue(new Error('Database error'));
            await expect(paymentService.cancelPayment(1)).rejects.toThrow(HTTPError);
        });

        it('should throw error when cancellation updates fail', async () => {
            mockPrisma.payment.update.mockResolvedValue(null);
            mockPrisma.orderFoodItem.updateMany.mockResolvedValue(null);
            mockPrisma.orderDrinkItem.updateMany.mockResolvedValue(null);
            mockPrisma.order.update.mockResolvedValue(null);
            await expect(paymentService.cancelPayment(1)).rejects.toThrow('Payment cancellation failed');
        });

        it('should handle case when update operations fail', async () => {
            mockPrisma.payment.update.mockResolvedValue(null);
            mockPrisma.orderFoodItem.updateMany.mockResolvedValue(null);
            mockPrisma.orderDrinkItem.updateMany.mockResolvedValue(null);
            mockPrisma.order.update.mockResolvedValue(null);
            await expect(paymentService.cancelPayment(1)).rejects.toThrow('Payment cancellation failed');
        });
    });

    describe('checkOrderPaymentCompletion', () => {
        it('should return true when all items are paid', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                foodItems: [
                    { paymentStatus: PaymentState.PAID },
                    { paymentStatus: PaymentState.PAID }
                ],
                drinkItems: [
                    { paymentStatus: PaymentState.PAID }
                ]
            });

            const result = await (paymentService as any).checkOrderPaymentCompletion(1);
            expect(result).toBe(true);
        });

        it('should return false when some items are not paid', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                foodItems: [
                    { paymentStatus: PaymentState.PAID },
                    { paymentStatus: PaymentState.PENDING }
                ],
                drinkItems: [
                    { paymentStatus: PaymentState.PAID }
                ]
            });

            const result = await (paymentService as any).checkOrderPaymentCompletion(1);
            expect(result).toBe(false);
        });

        it('should throw error when order not found', async () => {
            mockPrisma.order.findUnique.mockResolvedValue(null);
            await expect((paymentService as any).checkOrderPaymentCompletion(1))
                .rejects.toThrow('Order not found');
        });

        it('should handle database errors', async () => {
            mockPrisma.order.findUnique.mockRejectedValue(new Error('Database error'));
            await expect((paymentService as any).checkOrderPaymentCompletion(1))
                .rejects.toThrow(HTTPError);
        });

        it('should return true when there are no items in the order', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                foodItems: [],
                drinkItems: []
            });
            const result = await (paymentService as any).checkOrderPaymentCompletion(1);
            expect(result).toBe(true);
        });
    });

    describe('AbstractPaymentService', () => {
        describe('calculatePaymentAmount', () => {
            it('should calculate total amount correctly', () => {
                const items = [
                    { finalPrice: 10 },
                    { finalPrice: 20 },
                    { finalPrice: 30 }
                ];
                const total = (paymentService as any).calculatePaymentAmount(items);
                expect(total).toBe(60);
            });

            it('should return 0 for empty items array', () => {
                const total = (paymentService as any).calculatePaymentAmount([]);
                expect(total).toBe(0);
            });
        });

        describe('calculateTaxAndCharges', () => {
            it('should calculate tax and charges correctly', () => {
                const result = (paymentService as any).calculateTaxAndCharges(100);
                expect(result).toEqual({
                    tax: 10,
                    serviceCharge: 5,
                    total: 115
                });
            });

            it('should handle zero subtotal', () => {
                const result = (paymentService as any).calculateTaxAndCharges(0);
                expect(result).toEqual({
                    tax: 0,
                    serviceCharge: 0,
                    total: 0
                });
            });
        });

        describe('validateItems', () => {
            const mockOrderItems = {
                foodItems: [
                    { id: 1, paymentStatus: PaymentState.NONE },
                    { id: 2, paymentStatus: PaymentState.PAID },
                    { id: 3, paymentStatus: PaymentState.PENDING }
                ],
                drinkItems: [
                    { id: 4, paymentStatus: PaymentState.NONE },
                    { id: 5, paymentStatus: PaymentState.PAID },
                    { id: 6, paymentStatus: PaymentState.PENDING }
                ]
            };

            it('should return only valid items with NONE status', () => {
                const result = (paymentService as any).validateItems([4], [1], mockOrderItems);
                expect(result).toEqual({
                    selectedDrinks: [{ id: 4, paymentStatus: PaymentState.NONE }],
                    selectedFoods: [{ id: 1, paymentStatus: PaymentState.NONE }]
                });
            });

            it('should handle empty arrays with undefined values', () => {
                const result = (paymentService as any).validateItems(undefined, undefined, mockOrderItems);
                expect(result).toEqual({
                    selectedDrinks: [],
                    selectedFoods: []
                });
            });

            it('should validate food items with invalid status', () => {
                expect(() => (paymentService as any).validateItems([], [2], mockOrderItems))
                    .toThrow('Invalid items selected or cannot add processed items to another payment');
            });

            it('should validate drink items with invalid status', () => {
                expect(() => (paymentService as any).validateItems([5], [], mockOrderItems))
                    .toThrow('Invalid items selected or cannot add processed items to another payment');
            });

            it('should handle undefined food items array', () => {
                const result = (paymentService as any).validateItems([4], undefined, mockOrderItems);
                expect(result).toEqual({
                    selectedDrinks: [{ id: 4, paymentStatus: PaymentState.NONE }],
                    selectedFoods: []
                });
            });

            it('should handle undefined drink items array', () => {
                const result = (paymentService as any).validateItems(undefined, [1], mockOrderItems);
                expect(result).toEqual({
                    selectedDrinks: [],
                    selectedFoods: [{ id: 1, paymentStatus: PaymentState.NONE }]
                });
            });
        });
    });
});