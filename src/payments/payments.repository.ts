import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import {
  PaymentCreateDto,
  PaymentDTO,
  PaymentListDTO,
  PaymentSearchCriteria,
  RefundDTO,
} from './dto';
import { PaymentService } from './old/payment.service';
import { IPaymentsRepository } from './payments.repository.interface';

@injectable()
export class PaymentsRepository implements IPaymentsRepository {
  constructor(
    @inject(TYPES.PaymentService) private paymentService: PaymentService
  ) {}

  findMany(criteria: PaymentSearchCriteria): Promise<PaymentListDTO> {
    return this.paymentService.findPayments(criteria);
  }
  findById(id: number): Promise<PaymentDTO> {
    return this.paymentService.findPaymentById(id);
  }
  create(orderId: number, data: PaymentCreateDto): Promise<string> {
    return this.paymentService.createPayment(
      orderId,
      data.drinkItems,
      data.foodItems
    );
  }
  complete(id: number): Promise<string> {
    return this.paymentService.completePayment(id);
  }
  refund(id: number, refund: RefundDTO): Promise<string> {
    return this.paymentService.refundPayment(id, refund.reason);
  }
  cancel(id: number): Promise<string> {
    return this.paymentService.cancelPayment(id);
  }
}
