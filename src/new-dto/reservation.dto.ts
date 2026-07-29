import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class ReservationDto {
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @IsNumber()
  @Type(() => Number)
  tableId!: number;

  @IsString()
  @MinLength(1)
  guestName!: string;

  @IsNumber()
  @Type(() => Number)
  guestCount!: number;

  @IsDate()
  @Type(() => Date)
  reservationTime!: Date;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateReservationDto {
  @IsNumber()
  @Type(() => Number)
  tableId!: number;

  @IsString()
  @MinLength(1)
  guestName!: string;

  @IsNumber()
  @Type(() => Number)
  guestCount!: number;

  @IsDate()
  @Type(() => Date)
  reservationTime!: Date;
}
