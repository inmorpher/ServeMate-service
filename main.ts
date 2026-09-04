import { PrismaClient } from '@prisma/client';
import {
  Container,
  ContainerModule,
  type ContainerModuleLoadOptions,
} from 'inversify';
import 'reflect-metadata';
import { App } from './src/app';
import { authContainerModule } from './src/auth/auth.container';
import { BaseService } from './src/common/base.service';
import { DatabaseProvider } from './src/common/database.provider';
import { drinkItemsContainerModule } from './src/drink-items/drink-items.container';
import { ExceptionFilter } from './src/errors/exception.filter';
import { IExceptionFilter } from './src/errors/exception.filter.interface';
import { foodItemsContainerModule } from './src/food-items/food-items.container';
import { LoggerService } from './src/logger/logger.service';
import { ILogger } from './src/logger/logger.service.interface';
import { ordersContainerModule } from './src/orders/orders.container';
import { paymentsContainerModule } from './src/payments/payments.container';
import { reservationsContainerModule } from './src/reservations/reservations.container';
import { tablesContainerModule } from './src/tables/tables.container';
import { TYPES } from './src/types';
import { userContainerModule } from './src/users/users.container';
import { websocketContainerModule } from './src/websocket/websocket.container';
import { workspaceContainerModule } from './src/workspace/workspace.container';
/**
 * Module that binds core services to their respective implementations in a singleton scope.
 *
 * @module coreServicesModule
 *
 * @param {interfaces.Bind} bind - The bind function used to bind interfaces to their implementations.
 *
 * Bindings:
 * - ILogger to LoggerService
 * - IExceptionFilter to ExceptionFilter
 * - ITokenService to TokenService
 * - PrismaClient to a constant value of a new PrismaClient instance
 */
export const coreServicesModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<ILogger>(TYPES.ILogger).to(LoggerService).inSingletonScope();
    bind<IExceptionFilter>(TYPES.ExceptionFilter)
      .to(ExceptionFilter)
      .inSingletonScope();
    // Prisma 7 с адаптером PostgreSQL
  }
);

export const databaseModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<PrismaClient>(TYPES.PrismaClient)
      .toDynamicValue(() => {
        return DatabaseProvider.getInstance();
      })
      .inSingletonScope();
  }
);

/**
 * Container module for the application.
 *
 * This module binds the `App` class to the `TYPES.Application` identifier
 * in a singleton scope, ensuring that only one instance of the `App` class
 * is created and shared throughout the application.
 *
 * @module appModule
 * @param bind - The bind function used to bind types to implementations.
 */
export const appModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<App>(TYPES.Application).to(App).inSingletonScope();
  }
);

/**
 * Container module that binds the `BaseService` to the `TYPES.BaseService` identifier.
 * The `BaseService` is bound in a singleton scope, meaning that only one instance of
 * `BaseService` will be created and shared throughout the application.
 *
 * @param bind - The bind function used to bind the service to the identifier.
 */
export const baseModules = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<BaseService>(TYPES.BaseService).to(BaseService).inSingletonScope();
  }
);

/**
 * An array of application modules to be bound to the application.
 *
 * This array includes the following modules:
 * - `coreServicesModule`: Core services required by the application.
 * - `authModule`: Authentication services and logic.
 * - `userModule`: User management and related services.
 * - `tablesModule`: Services related to table management.
 * - `ordersModule`: Order processing and management services.
 * - `appModule`: Main application module.
 * - `baseModules`: Base modules required for the application to function.
 */
export const appBindings = [
  coreServicesModule,
  websocketContainerModule,
  databaseModule,
  authContainerModule,
  userContainerModule,
  tablesContainerModule,
  ordersContainerModule,
  paymentsContainerModule,
  reservationsContainerModule,
  foodItemsContainerModule,
  drinkItemsContainerModule,
  workspaceContainerModule,
  appModule,
  baseModules,
];

/**
 * Initializes the application by creating a new IoC container, loading the necessary bindings,
 * and starting the application.
 *
 * @returns An object containing the initialized application instance and the IoC container.
 */
const bootstrap = () => {
  const appContainer = new Container();
  appContainer.load(...appBindings);

  return DatabaseProvider.connect()
    .then(() => {
      const app = appContainer.get<App>(TYPES.Application);
      app.init();

      // На graceful shutdown отключаюсь от БД
      process.on('SIGINT', async () => {
        console.log('\nShutting down gracefully...');
        await DatabaseProvider.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await DatabaseProvider.disconnect();
        process.exit(0);
      });

      return { app, appContainer };
    })
    .catch(error => {
      console.error('\x1b[31m✗ Failed to bootstrap application:\x1b[0m', error);
      process.exit(1);
    });
};

bootstrap();
