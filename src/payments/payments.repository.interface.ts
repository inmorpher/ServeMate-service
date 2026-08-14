import {
  PaymentCreateDto,
  PaymentDTO,
  PaymentListDTO,
  PaymentSearchCriteria,
  RefundDTO,
} from './dto';

export interface IPaymentsRepository {
  findMany(criteria: PaymentSearchCriteria): Promise<PaymentListDTO>;
  findById(id: number): Promise<PaymentDTO>;
  create(orderId: number, data: PaymentCreateDto): Promise<string>;
  complete(id: number): Promise<string>;
  refund(id: number, refund: RefundDTO): Promise<string>;
  cancel(id: number): Promise<string>;
}
