import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../common/base.service';
import { TYPES } from '../types';
import { publishRealtimeEvent } from '../websocket/realtime-event';
import { IWebSocketService } from '../websocket/websocket.service.interface';
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
    private paymentsRepository: IPaymentsRepository,
    @inject(TYPES.WebSocketService)
    private readonly realtimeGateway?: IWebSocketService
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
      const result = await this.paymentsRepository.create(orderId, data);
      publishRealtimeEvent(
        this.realtimeGateway,
        'payments',
        'created',
        orderId,
        result
      );
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async completePayment(id: number): Promise<string> {
    try {
      const result = await this.paymentsRepository.complete(id);
      publishRealtimeEvent(
        this.realtimeGateway,
        'payments',
        'completed',
        id,
        result
      );
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async refundPayment(id: number, refund: RefundDTO): Promise<string> {
    try {
      const result = await this.paymentsRepository.refund(id, refund);
      publishRealtimeEvent(
        this.realtimeGateway,
        'payments',
        'refunded',
        id,
        result
      );
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async cancelPayment(id: number): Promise<string> {
    try {
      const result = await this.paymentsRepository.cancel(id);
      publishRealtimeEvent(
        this.realtimeGateway,
        'payments',
        'cancelled',
        id,
        result
      );
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
