import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentState } from '../dto-package/src/dto/enums';

export class PaymentDto {
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @IsNumber()
  @Type(() => Number)
  orderId!: number;

  @IsNumber()
  @Type(() => Number)
  amount!: number;

  @IsEnum(PaymentState)
  status!: PaymentState;

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;
}

export class RefundDto {
  @IsNumber()
  @Type(() => Number)
  orderId!: number;

  @IsNumber()
  @Type(() => Number)
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
