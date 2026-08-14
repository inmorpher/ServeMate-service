import { ContainerModule, ContainerModuleLoadOptions } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { IOrdersRepository } from './orders.repository.interface';
import { OrdersService } from './orders.service';
import { IOrdersService } from './orders.service.interface';

export const ordersContainerModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<IOrdersRepository>(TYPES.OrdersRepository)
      .to(OrdersRepository)
      .inSingletonScope();
    bind<IOrdersService>(TYPES.OrdersService)
      .to(OrdersService)
      .inSingletonScope();
    bind<OrdersController>(TYPES.OrdersController)
      .to(OrdersController)
      .inSingletonScope();
  }
);
