import { ContainerModule, ContainerModuleLoadOptions } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { PaymentService } from './old/payment.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { IPaymentsRepository } from './payments.repository.interface';
import { PaymentsService } from './payments.service';
import { IPaymentsService } from './payments.service.interface';

export const paymentsContainerModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<PaymentService>(TYPES.PaymentService)
      .to(PaymentService)
      .inSingletonScope();
    bind<IPaymentsRepository>(TYPES.PaymentsRepository)
      .to(PaymentsRepository)
      .inSingletonScope();
    bind<IPaymentsService>(TYPES.PaymentsService)
      .to(PaymentsService)
      .inSingletonScope();
    bind<PaymentsController>(TYPES.PaymentsController)
      .to(PaymentsController)
      .inSingletonScope();
  }
);
