import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { OrderState } from '../dto-package/src/dto/enums';

export class OrderItemDto {
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsNumber()
  @Type(() => Number)
  price!: number;

  @IsNumber()
  @Type(() => Number)
  quantity!: number;
}

export class OrderDto {
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @IsNumber()
  @Type(() => Number)
  tableId!: number;

  @IsNumber()
  @Type(() => Number)
  guestCount!: number;

  @IsEnum(OrderState)
  status!: OrderState;

  @IsNumber()
  @Type(() => Number)
  totalAmount!: number;

  @IsArray()
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt!: Date;
}

export class OrderCreateDto {
  @IsNumber()
  @Type(() => Number)
  tableId!: number;

  @IsNumber()
  @Type(() => Number)
  guestCount!: number;

  @IsArray()
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

export class OrderUpdateDto {
  @IsOptional()
  @IsEnum(OrderState)
  status?: OrderState;

  @IsOptional()
  @IsArray()
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}
