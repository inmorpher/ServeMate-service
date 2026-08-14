import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../common/base.service';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
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
    private reservationsRepository: IReservationsRepository
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
      return await this.reservationsRepository.create(data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateReservation(
    id: number,
    data: ReservationUpdateDto
  ): Promise<ReservationDetailedDto> {
    try {
      return await this.reservationsRepository.update(id, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateGuestInfo(
    id: number,
    data: ReservationGuestInfoDto
  ): Promise<ReservationDetailedDto> {
    try {
      return await this.reservationsRepository.updateGuestInfo(id, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateStatus(
    id: number,
    status: ReservationStatus
  ): Promise<ReservationDetailedDto> {
    try {
      return await this.reservationsRepository.updateStatus(id, status);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateTime(id: number, time: Date): Promise<ReservationDetailedDto> {
    try {
      return await this.reservationsRepository.updateTime(id, time);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateTables(
    id: number,
    tables: number[]
  ): Promise<ReservationDetailedDto> {
    try {
      return await this.reservationsRepository.updateTables(id, tables);
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
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
