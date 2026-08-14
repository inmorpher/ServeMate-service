import {
  PaymentCreateDto,
  PaymentDTO,
  PaymentListDTO,
  PaymentSearchCriteria,
  RefundDTO,
} from './dto';

export interface IPaymentsService {
  findPayments(criteria: PaymentSearchCriteria): Promise<PaymentListDTO>;
  findPaymentById(id: number): Promise<PaymentDTO>;
  createPayment(orderId: number, data: PaymentCreateDto): Promise<string>;
  completePayment(id: number): Promise<string>;
  refundPayment(id: number, refund: RefundDTO): Promise<string>;
  cancelPayment(id: number): Promise<string>;
}
