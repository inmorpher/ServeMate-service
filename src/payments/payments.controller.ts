import { UserRole } from '@prisma/client';
import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseController } from '../common/base.controller';
import { TypedRequest } from '../common/route.interface';
import { Controller, Get, Post } from '../decorators/httpDecorators';
import { Roles } from '../decorators/Roles';
import { ILogger } from '../logger/logger.service.interface';
import { Validate } from '../middleware/validate/validate.middleware';
import { TYPES } from '../types';
import {
  PaymentCreateDto,
  PaymentCreateSchema,
  PaymentParamsDto,
  PaymentParamsSchema,
  PaymentSearchCriteria,
  PaymentSearchSchema,
  RefundDTO,
  RefundSchema,
} from './dto';
import { IPaymentsService } from './payments.service.interface';

export type PaymentsControllerService = Pick<
  IPaymentsService,
  | 'findPayments'
  | 'findPaymentById'
  | 'createPayment'
  | 'completePayment'
  | 'refundPayment'
  | 'cancelPayment'
>;

@injectable()
@Controller('/payments')
export class PaymentsController extends BaseController {
  constructor(
    @inject(TYPES.ILogger) logger: ILogger,
    @inject(TYPES.PaymentsService)
    private paymentsService: PaymentsControllerService
  ) {
    super(logger);
  }

  @Validate(PaymentSearchSchema, 'query')
  @Get('/')
  async findAll(
    req: TypedRequest<{}, PaymentSearchCriteria, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.paymentsService.findPayments(this.getValidated(req, 'query'))
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(PaymentParamsSchema, 'params')
  @Get('/:id')
  async findOne(
    req: TypedRequest<PaymentParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.paymentsService.findPaymentById(
          this.getValidated(req, 'params').id
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(PaymentParamsSchema, 'params')
  @Validate(PaymentCreateSchema, 'body')
  @Post('/order/:id')
  async create(
    req: TypedRequest<PaymentParamsDto, {}, PaymentCreateDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.paymentsService.createPayment(
          this.getValidated(req, 'params').id,
          this.getValidated(req, 'body')
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(PaymentParamsSchema, 'params')
  @Post('/complete/:id')
  async complete(
    req: TypedRequest<PaymentParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.paymentsService.completePayment(
          this.getValidated(req, 'params').id
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(PaymentParamsSchema, 'params')
  @Validate(RefundSchema, 'body')
  @Roles([UserRole.ADMIN, UserRole.MANAGER])
  @Post('/refund/:id')
  async refund(
    req: TypedRequest<PaymentParamsDto, {}, RefundDTO>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.paymentsService.refundPayment(
          this.getValidated(req, 'params').id,
          this.getValidated(req, 'body')
        )
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(PaymentParamsSchema, 'params')
  @Post('/cancel/:id')
  async cancel(
    req: TypedRequest<PaymentParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.ok(
        res,
        await this.paymentsService.cancelPayment(
          this.getValidated(req, 'params').id
        )
      );
    } catch (error) {
      next(error);
    }
  }
}
