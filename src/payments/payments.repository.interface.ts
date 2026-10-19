import {
  PaymentCreateDto,
  PaymentDTO,
  PaymentListDTO,
  PaymentMetaDto,
  PaymentSearchCriteria,
  RefundDTO,
} from './dto';

export interface IPaymentsRepository {
  getMeta(): Promise<PaymentMetaDto>;
  findMany(criteria: PaymentSearchCriteria): Promise<PaymentListDTO>;
  findById(id: number): Promise<PaymentDTO>;
  create(orderId: number, data: PaymentCreateDto): Promise<string>;
  complete(id: number): Promise<string>;
  refund(id: number, refund: RefundDTO): Promise<string>;
  cancel(id: number): Promise<string>;
}
