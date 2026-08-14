import {
  ReservationCreateDto,
  ReservationDetailedDto,
  ReservationDto,
  ReservationGuestInfoDto,
  ReservationListResponse,
  ReservationQueryDto,
  ReservationStatus,
  ReservationUpdateDto,
} from './dto';

export interface IReservationsService {
  findReservations(
    criteria: ReservationQueryDto
  ): Promise<ReservationListResponse>;
  findReservationById(id: number): Promise<ReservationDto | null>;
  createReservation(
    data: ReservationCreateDto
  ): Promise<ReservationDetailedDto>;
  updateReservation(
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
  deleteReservation(id: number): Promise<void>;
}
