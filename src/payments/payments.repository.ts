import { PaymentState, Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import {
  PaymentCreateDto,
  PaymentDTO,
  PaymentListDTO,
  PaymentSearchCriteria,
  RefundDTO,
} from './dto';
import { IPaymentsRepository } from './payments.repository.interface';

@injectable()
export class PaymentsRepository implements IPaymentsRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  async findMany(criteria: PaymentSearchCriteria): Promise<PaymentListDTO> {
    const where: Prisma.PaymentWhereInput = {
      ...(criteria.status && { status: criteria.status }),
      ...(criteria.orderId && { orderId: criteria.orderId }),
    };
    const allowedSortFields = new Set([
      'id',
      'createdAt',
      'status',
      'totalAmount',
    ]);
    const sortBy = allowedSortFields.has(criteria.sortBy)
      ? criteria.sortBy
      : 'createdAt';
    const [payments, totalCount] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: (criteria.page - 1) * criteria.pageSize,
        take: criteria.pageSize,
        orderBy: {
          [sortBy]: criteria.sortOrder,
        } as Prisma.PaymentOrderByWithRelationInput,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return {
      payments,
      totalCount,
      page: criteria.page,
      pageSize: criteria.pageSize,
      totalPages: Math.ceil(totalCount / criteria.pageSize),
    };
  }

  async findById(id: number): Promise<PaymentDTO> {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment)
      throw new HTTPError(404, 'PaymentsRepository', 'Payment not found');
    return payment;
  }

  async create(orderId: number, data: PaymentCreateDto): Promise<string> {
    const [foodItems, drinkItems] = await Promise.all([
      this.prisma.orderFoodItem.findMany({
        where: { orderId, id: { in: data.foodItems } },
      }),
      this.prisma.orderDrinkItem.findMany({
        where: { orderId, id: { in: data.drinkItems } },
      }),
    ]);
    const amount = [...foodItems, ...drinkItems].reduce(
      (sum, item) => sum + item.finalPrice,
      0
    );
    await this.prisma.payment.create({
      data: {
        orderId,
        amount,
        totalAmount: amount,
        orderFoodItems: { connect: foodItems.map(item => ({ id: item.id })) },
        orderDrinkItems: { connect: drinkItems.map(item => ({ id: item.id })) },
      },
    });
    return 'Payment created successfully';
  }

  async complete(id: number): Promise<string> {
    await this.requirePayment(id);
    await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentState.PAID, completedAt: new Date() },
    });
    return 'Payment completed successfully';
  }

  async refund(id: number, refund: RefundDTO): Promise<string> {
    await this.requirePayment(id);
    await this.prisma.$transaction([
      this.prisma.refundPayment.create({
        data: { paymentId: id, amount: refund.amount, reason: refund.reason },
      }),
      this.prisma.payment.update({
        where: { id },
        data: { status: PaymentState.REFUNDED },
      }),
    ]);
    return 'Payment refunded successfully';
  }

  async cancel(id: number): Promise<string> {
    await this.requirePayment(id);
    await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentState.CANCELLED },
    });
    return 'Payment cancelled successfully';
  }

  private async requirePayment(id: number): Promise<void> {
    if (
      !(await this.prisma.payment.findUnique({
        where: { id },
        select: { id: true },
      }))
    ) {
      throw new HTTPError(404, 'PaymentsRepository', 'Payment not found');
    }
  }
}
