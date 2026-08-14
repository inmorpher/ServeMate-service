import {
  ReservationCreateDto,
  ReservationDetailedDto,
  ReservationDto,
  ReservationGuestInfoDto,
  ReservationQueryDto,
  ReservationStatus,
  ReservationUpdateDto,
} from './dto';

export interface IReservationsRepository {
  findMany(criteria: ReservationQueryDto): Promise<{
    reservations: ReservationDto[];
    total: number;
  }>;
  findById(id: number): Promise<ReservationDto | null>;
  create(data: ReservationCreateDto): Promise<ReservationDetailedDto>;
  update(
    id: number,
    data: ReservationUpdateDto
  ): Promise<ReservationDetailedDto>;
  updateGuestInfo(
    id: number,
    data: ReservationGuestInfoDto
  ): Promise<ReservationDetailedDto>;
  updateStatus(
    id: number,
    status: ReservationStatus
  ): Promise<ReservationDetailedDto>;
  updateTime(id: number, time: Date): Promise<ReservationDetailedDto>;
  updateTables(id: number, tables: number[]): Promise<ReservationDetailedDto>;
  delete(id: number): Promise<void>;
}
