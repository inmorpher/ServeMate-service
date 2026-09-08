import { ReservationStatus, UserRole } from '@prisma/client';
import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseController } from '../common/base.controller';
import { TypedRequest } from '../common/route.interface';
import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
} from '../decorators/httpDecorators';
import { Roles } from '../decorators/Roles';
import { ILogger } from '../logger/logger.service.interface';
import { Validate } from '../middleware/validate/validate.middleware';
import { TYPES } from '../types';
import {
  ReservationCommentSchema,
  ReservationCreateDto,
  ReservationCreateSchema,
  ReservationGuestInfoDto,
  ReservationGuestInfoSchema,
  ReservationParamsDto,
  ReservationParamsSchema,
  ReservationQueryDto,
  ReservationQuerySchema,
  ReservationStatusDto,
  ReservationStatusSchema,
  ReservationTablesDto,
  ReservationTablesSchema,
  ReservationTimeDto,
  ReservationTimeSchema,
  ReservationUpdateDto,
  ReservationUpdateSchema,
} from './dto';
import { IReservationsService } from './reservations.service.interface';

export type ReservationsControllerService = Pick<
  IReservationsService,
  | 'findReservations'
  | 'findReservationById'
  | 'createReservation'
  | 'updateReservation'
  | 'updateGuestInfo'
  | 'updateStatus'
  | 'updateTime'
  | 'updateTables'
  | 'deleteReservation'
>;

@injectable()
@Controller('/reservations')
export class ReservationsController extends BaseController {
  constructor(
    @inject(TYPES.ILogger) logger: ILogger,
    @inject(TYPES.ReservationsService)
    private reservationsService: ReservationsControllerService
  ) {
    super(logger);
  }

  @Validate(ReservationCreateSchema, 'body')
  @Post('/')
  async create(
    req: TypedRequest<{}, {}, ReservationCreateDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.reservationsService.createReservation(
          this.getValidated(req, 'body')
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(ReservationQuerySchema, 'query')
  @Get('/')
  async findAll(
    req: TypedRequest<{}, ReservationQueryDto, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.reservationsService.findReservations(
          this.getValidated(req, 'query')
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(ReservationParamsSchema, 'params')
  @Get('/:id')
  async findOne(
    req: TypedRequest<ReservationParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const reservation = await this.reservationsService.findReservationById(
        this.getValidated(req, 'params').id
      );
      if (!reservation) return this.notFound(res, 'Reservation not found');
      this.ok(res, reservation);
    } catch (error) {
      next(error);
    }
  }

  @Validate(ReservationUpdateSchema, 'body')
  @Validate(ReservationParamsSchema, 'params')
  @Put('/:id')
  async update(
    req: TypedRequest<ReservationParamsDto, {}, ReservationUpdateDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.reservationsService.updateReservation(
          this.getValidated(req, 'params').id,
          this.getValidated(req, 'body')
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(ReservationStatusSchema, 'body')
  @Validate(ReservationParamsSchema, 'params')
  @Patch('/:id/status')
  async updateStatus(
    req: TypedRequest<ReservationParamsDto, {}, ReservationStatusDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.reservationsService.updateStatus(
          this.getValidated(req, 'params').id,
          this.getValidated(req, 'body').status as ReservationStatus
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(ReservationTimeSchema, 'body')
  @Validate(ReservationParamsSchema, 'params')
  @Patch('/:id/time')
  async updateTime(
    req: TypedRequest<ReservationParamsDto, {}, ReservationTimeDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.reservationsService.updateTime(
          this.getValidated(req, 'params').id,
          this.getValidated(req, 'body').time
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(ReservationTablesSchema, 'body')
  @Validate(ReservationParamsSchema, 'params')
  @Patch('/:id/tables')
  async updateTables(
    req: TypedRequest<ReservationParamsDto, {}, ReservationTablesDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.reservationsService.updateTables(
          this.getValidated(req, 'params').id,
          this.getValidated(req, 'body').tables
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(ReservationGuestInfoSchema, 'body')
  @Validate(ReservationParamsSchema, 'params')
  @Patch('/:id/guest-info')
  async updateGuestInfo(
    req: TypedRequest<ReservationParamsDto, {}, ReservationGuestInfoDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.reservationsService.updateGuestInfo(
          this.getValidated(req, 'params').id,
          this.getValidated(req, 'body')
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(ReservationParamsSchema, 'params')
  @Validate(ReservationCommentSchema, 'body')
  @Patch('/:id/comment')
  async updateComment(
    req: TypedRequest<ReservationParamsDto, {}, { comments: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.reservationsService.updateReservation(
          this.getValidated(req, 'params').id,
          { comments: req.body.comments }
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(ReservationParamsSchema, 'params')
  @Delete('/:id')
  @Roles([UserRole.ADMIN, UserRole.MANAGER])
  async delete(
    req: TypedRequest<ReservationParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      await this.reservationsService.deleteReservation(
        this.getValidated(req, 'params').id
      );
      this.ok(res, { message: 'Reservation deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
