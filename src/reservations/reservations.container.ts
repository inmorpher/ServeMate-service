import { ContainerModule, ContainerModuleLoadOptions } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { ReservationsController } from './reservations.controller';
import { ReservationsRepository } from './reservations.repository';
import { IReservationsRepository } from './reservations.repository.interface';
import { ReservationsService } from './reservations.service';
import { IReservationsService } from './reservations.service.interface';

export const reservationsContainerModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<IReservationsRepository>(TYPES.ReservationsRepository)
      .to(ReservationsRepository)
      .inSingletonScope();
    bind<IReservationsService>(TYPES.ReservationsService)
      .to(ReservationsService)
      .inSingletonScope();
    bind<ReservationsController>(TYPES.ReservationsController)
      .to(ReservationsController)
      .inSingletonScope();
  }
);
