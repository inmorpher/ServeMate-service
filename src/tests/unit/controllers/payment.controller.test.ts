import { NextFunction, Response } from 'express';
import 'reflect-metadata';
import { TypedRequest } from '../../../common/route.interface';
import { PaymentController } from '../../../controllers/payments/payment.controller';
import { PaymentSearchCriteria, RefundDTO } from '../../../dto/payment.dto';
import { ILogger } from '../../../services/logger/logger.service.interface';
import { PaymentService } from '../../../services/payment/payment.service';
import { PaymentState, PaymentMethod } from '../../../dto/enums';

describe('PaymentController', () => {
  let paymentController: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;
  let loggerService: jest.Mocked<ILogger>;
  let res: Partial<Response>;
  let next: NextFunction;
  let okSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock services
    paymentService = {
      findPayments: jest.fn(),
      findPaymentById: jest.fn(),
      createPayment: jest.fn(),
      completePayment: jest.fn(),
      refundPayment: jest.fn(),
      cancelPayment: jest.fn(),
    } as any;

    loggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    // Initialize controller
    paymentController = new PaymentController(loggerService, paymentService);

    // Setup response mock
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Setup okSpy
    const mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    okSpy = jest.spyOn(paymentController, 'ok').mockImplementation(() => mockResponse);
    next = jest.fn();
  });

  describe('getPayments', () => {
    it('should return list of payments successfully', async () => {
      const mockResult = {
        payments: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      const criteria: PaymentSearchCriteria = {
        page: 1,
        pageSize: 10,
        sortBy: 'id',
        sortOrder: 'asc',
      };

      const req = {
        query: criteria,
      } as TypedRequest<{}, PaymentSearchCriteria, {}>;

      paymentService.findPayments.mockResolvedValue(mockResult);

      await paymentController.getPayments(req, res as Response, next);

      expect(paymentService.findPayments).toHaveBeenCalledWith(criteria);
      expect(okSpy).toHaveBeenCalledWith(res, mockResult);
    });

    it('should handle errors when getting payments', async () => {
      const error = new Error('Database error');
      const req = {
        query: {},
      } as TypedRequest<{}, PaymentSearchCriteria, {}>;

      paymentService.findPayments.mockRejectedValue(error);

      await paymentController.getPayments(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getPayment', () => {
    it('should return a payment by ID successfully', async () => {
      const mockPayment = {
        id: 1,
        amount: 100,
        tax: 10,
        tip: 15,
        serviceCharge: 5,
        paymentType: PaymentMethod.CASH,
        status: PaymentState.PENDING,
        createdAt: new Date(),
        completedAt: null,
        orderId: 1,
      };

      const req = {
        params: { id: 1 },
      } as TypedRequest<{ id: number }>;

      paymentService.findPaymentById.mockResolvedValue(mockPayment);

      await paymentController.getPayment(req, res as Response, next);

      expect(paymentService.findPaymentById).toHaveBeenCalledWith(1);
      expect(okSpy).toHaveBeenCalledWith(res, mockPayment);
    });

    it('should handle errors when getting payment by ID', async () => {
      const error = new Error('Payment not found');
      const req = {
        params: { id: 999 },
      } as TypedRequest<{ id: number }>;

      paymentService.findPaymentById.mockRejectedValue(error);

      await paymentController.getPayment(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      const mockResponse = 'Payment created successfully';

      const req = {
        params: { id: 1 },
        body: {
          foodItems: [1, 2],
          drinkItems: [3],
        },
      } as TypedRequest<{ id: number }, {}, { foodItems: number[]; drinkItems: number[] }>;

      paymentService.createPayment.mockResolvedValue(mockResponse);

      await paymentController.createPayment(req, res as Response, next);

      expect(paymentService.createPayment).toHaveBeenCalledWith(1, [3], [1, 2]);
      expect(okSpy).toHaveBeenCalledWith(res, mockResponse);
    });

    it('should handle errors when creating payment', async () => {
      const error = new Error('Creation failed');
      const req = {
        params: { id: 1 },
        body: {
          foodItems: [1],
          drinkItems: [2],
        },
      } as TypedRequest<{ id: number }, {}, { foodItems: number[]; drinkItems: number[] }>;

      paymentService.createPayment.mockRejectedValue(error);

      await paymentController.createPayment(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('completePayment', () => {
    it('should complete a payment successfully', async () => {
      const mockResponse = 'Payment completed successfully';

      const req = {
        params: { id: 1 },
      } as TypedRequest<{ id: number }>;

      paymentService.completePayment.mockResolvedValue(mockResponse);

      await paymentController.completePayment(req, res as Response, next);

      expect(paymentService.completePayment).toHaveBeenCalledWith(1);
      expect(okSpy).toHaveBeenCalledWith(res, mockResponse);
    });

    it('should handle errors when completing payment', async () => {
      const error = new Error('Completion failed');
      const req = {
        params: { id: 1 },
      } as TypedRequest<{ id: number }>;

      paymentService.completePayment.mockRejectedValue(error);

      await paymentController.completePayment(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('refundPayment', () => {
    it('should refund a payment successfully', async () => {
      const mockResponse = 'Payment refunded successfully';

      const refundData: RefundDTO = {
        reason: 'Customer dissatisfied',
        createdAt: new Date(),
      };

      const req = {
        params: { id: 1 },
        body: refundData,
      } as TypedRequest<{ id: number }, {}, RefundDTO>;

      paymentService.refundPayment.mockResolvedValue(mockResponse);

      await paymentController.refundPayment(req, res as Response, next);

      expect(paymentService.refundPayment).toHaveBeenCalledWith(1, refundData.reason);
      expect(okSpy).toHaveBeenCalledWith(res, mockResponse);
    });

    it('should handle errors when refunding payment', async () => {
      const error = new Error('Refund failed');
      const req = {
        params: { id: 1 },
        body: { reason: 'Test reason', createdAt: new Date() },
      } as TypedRequest<{ id: number }, {}, RefundDTO>;

      paymentService.refundPayment.mockRejectedValue(error);

      await paymentController.refundPayment(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('cancelPayment', () => {
    it('should cancel a payment successfully', async () => {
      const mockResponse = 'Payment cancelled successfully';

      const req = {
        params: { id: 1 },
      } as TypedRequest<{ id: number }>;

      paymentService.cancelPayment.mockResolvedValue(mockResponse);

      await paymentController.cancelPayment(req, res as Response, next);

      expect(paymentService.cancelPayment).toHaveBeenCalledWith(1);
      expect(okSpy).toHaveBeenCalledWith(res, mockResponse);
    });

    it('should handle errors when cancelling payment', async () => {
      const error = new Error('Cancellation failed');
      const req = {
        params: { id: 1 },
      } as TypedRequest<{ id: number }>;

      paymentService.cancelPayment.mockRejectedValue(error);

      await paymentController.cancelPayment(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});