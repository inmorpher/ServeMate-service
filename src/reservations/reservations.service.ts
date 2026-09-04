import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../common/base.service';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import { publishRealtimeEvent } from '../websocket/realtime-event';
import { IWebSocketService } from '../websocket/websocket.service.interface';
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
import { IReservationsRepository } from './reservations.repository.interface';
import { IReservationsService } from './reservations.service.interface';

@injectable()
export class ReservationsService
  extends BaseService
  implements IReservationsService
{
  protected serviceName = 'ReservationsService';

  constructor(
    @inject(TYPES.ReservationsRepository)
    private reservationsRepository: IReservationsRepository,
    @inject(TYPES.WebSocketService)
    private readonly realtimeGateway?: IWebSocketService
  ) {
    super();
  }

  async findReservations(
    criteria: ReservationQueryDto
  ): Promise<ReservationListResponse> {
    try {
      const { reservations, total } =
        await this.reservationsRepository.findMany(criteria);
      return {
        list: reservations,
        totalCount: total,
        page: criteria.page,
        pageSize: criteria.pageSize,
        totalPages: Math.ceil(total / criteria.pageSize),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async findReservationById(id: number): Promise<ReservationDto | null> {
    try {
      return await this.reservationsRepository.findById(id);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createReservation(
    data: ReservationCreateDto
  ): Promise<ReservationDetailedDto> {
    try {
      const reservation = await this.reservationsRepository.create(data);
      publishRealtimeEvent(
        this.realtimeGateway,
        'reservations',
        'created',
        undefined,
        reservation
      );
      return reservation;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateReservation(
    id: number,
    data: ReservationUpdateDto
  ): Promise<ReservationDetailedDto> {
    try {
      const reservation = await this.reservationsRepository.update(id, data);
      publishRealtimeEvent(
        this.realtimeGateway,
        'reservations',
        'updated',
        id,
        reservation
      );
      return reservation;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateGuestInfo(
    id: number,
    data: ReservationGuestInfoDto
  ): Promise<ReservationDetailedDto> {
    try {
      const reservation = await this.reservationsRepository.updateGuestInfo(
        id,
        data
      );
      publishRealtimeEvent(
        this.realtimeGateway,
        'reservations',
        'guest_info_updated',
        id,
        reservation
      );
      return reservation;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateStatus(
    id: number,
    status: ReservationStatus
  ): Promise<ReservationDetailedDto> {
    try {
      const reservation = await this.reservationsRepository.updateStatus(
        id,
        status
      );
      publishRealtimeEvent(
        this.realtimeGateway,
        'reservations',
        'status_updated',
        id,
        reservation
      );
      return reservation;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateTime(id: number, time: Date): Promise<ReservationDetailedDto> {
    try {
      const reservation = await this.reservationsRepository.updateTime(
        id,
        time
      );
      publishRealtimeEvent(
        this.realtimeGateway,
        'reservations',
        'time_updated',
        id,
        reservation
      );
      return reservation;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateTables(
    id: number,
    tables: number[]
  ): Promise<ReservationDetailedDto> {
    try {
      const reservation = await this.reservationsRepository.updateTables(
        id,
        tables
      );
      publishRealtimeEvent(
        this.realtimeGateway,
        'reservations',
        'tables_updated',
        id,
        reservation
      );
      return reservation;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteReservation(id: number): Promise<void> {
    try {
      if (!(await this.reservationsRepository.findById(id))) {
        throw new HTTPError(404, this.serviceName, 'Reservation not found');
      }
      await this.reservationsRepository.delete(id);
      publishRealtimeEvent(this.realtimeGateway, 'reservations', 'deleted', id);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
