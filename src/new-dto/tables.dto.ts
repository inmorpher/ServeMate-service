import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { TableCondition } from '../dto-package/src/dto/enums';

export class TableDto {
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @IsNumber()
  @Type(() => Number)
  tableNumber!: number;

  @IsNumber()
  @Type(() => Number)
  seats!: number;

  @IsBoolean()
  isOccupied!: boolean;

  @IsString()
  @MinLength(1)
  location!: string;

  @IsEnum(TableCondition)
  status!: TableCondition;

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt!: Date;
}

export class TableAssignmentDto {
  @IsNumber()
  @Type(() => Number)
  tableId!: number;

  @IsNumber()
  @Type(() => Number)
  orderId!: number;
}

export class TableCreateDto {
  @IsNumber()
  @Type(() => Number)
  tableNumber!: number;

  @IsNumber()
  @Type(() => Number)
  seats!: number;

  @IsString()
  @MinLength(1)
  location!: string;
}

export class TableUpdateDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tableNumber?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  seats?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  location?: string;

  @IsOptional()
  @IsBoolean()
  isOccupied?: boolean;
}
