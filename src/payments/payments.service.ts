import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../common/base.service';
import { TYPES } from '../types';
import {
  PaymentCreateDto,
  PaymentDTO,
  PaymentListDTO,
  PaymentSearchCriteria,
  RefundDTO,
} from './dto';
import { IPaymentsRepository } from './payments.repository.interface';
import { IPaymentsService } from './payments.service.interface';

@injectable()
export class PaymentsService extends BaseService implements IPaymentsService {
  protected serviceName = 'PaymentsService';
  constructor(
    @inject(TYPES.PaymentsRepository)
    private paymentsRepository: IPaymentsRepository
  ) {
    super();
  }
  async findPayments(criteria: PaymentSearchCriteria): Promise<PaymentListDTO> {
    try {
      return await this.paymentsRepository.findMany(criteria);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async findPaymentById(id: number): Promise<PaymentDTO> {
    try {
      return await this.paymentsRepository.findById(id);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async createPayment(
    orderId: number,
    data: PaymentCreateDto
  ): Promise<string> {
    try {
      return await this.paymentsRepository.create(orderId, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async completePayment(id: number): Promise<string> {
    try {
      return await this.paymentsRepository.complete(id);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async refundPayment(id: number, refund: RefundDTO): Promise<string> {
    try {
      return await this.paymentsRepository.refund(id, refund);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async cancelPayment(id: number): Promise<string> {
    try {
      return await this.paymentsRepository.cancel(id);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
