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
import { DrinkItemsController } from './src/drink-items/old/drink-items.controller';
import { DrinkItemsService } from './src/drink-items/old/drink-items.service';
import { ExceptionFilter } from './src/errors/exception.filter';
import { IExceptionFilter } from './src/errors/exception.filter.interface';
import { foodItemsContainerModule } from './src/food-items/food-items.container';
import { FoodItemsController } from './src/food-items/old/food-items.controller';
import { FoodItemsService } from './src/food-items/old/food-items.service';
import { ordersContainerModule } from './src/orders/orders.container';
import { paymentsContainerModule } from './src/payments/payments.container';
import { reservationsContainerModule } from './src/reservations/reservations.container';
import { LoggerService } from './src/services/logger/logger.service';
import { ILogger } from './src/services/logger/logger.service.interface';
import { tablesContainerModule } from './src/tables/tables.container';
import { TYPES } from './src/types';
import { userContainerModule } from './src/users/users.container';
import { WebSocketService } from './src/websocket/old/websocket.service';
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
    bind<WebSocketService>(TYPES.WebSocketService)
      .to(WebSocketService)
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
 * Container module for table-related services and controllers.
 *
 * This module binds the `ITableService` and `ITableController` interfaces
 * to their respective implementations (`TableService` and `TableController`)
 * in a singleton scope.
 *
 * @module tablesModule
 * @param bind - The bind function used to bind interfaces to implementations.
 */
/**
 * Container module for the Orders feature.
 *
 * This module binds the `OrdersService` and `OrdersController` to their respective
 * types in the IoC container, ensuring they are instantiated as singletons.
 *
 * @module ordersModule
 * @param bind - The bind function used to bind types to implementations in the IoC container.
 */
/**
 * Module that sets up the bindings for the FoodItems feature.
 *
 * This module binds the `FoodItemsController` and `FoodItemsService` to their respective
 * types in the InversifyJS container. Both bindings are set to singleton scope, meaning
 * that only one instance of each will be created and shared throughout the application.
 *
 * @module foodItemsModule
 * @param bind - The InversifyJS bind function used to bind types to implementations.
 */
export const foodItemsModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<FoodItemsController>(TYPES.FoodItemsController)
      .to(FoodItemsController)
      .inSingletonScope();
    bind<FoodItemsService>(TYPES.FoodItemsService)
      .to(FoodItemsService)
      .inSingletonScope();
  }
);

export const drinkItemsModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<DrinkItemsController>(TYPES.DrinkItemsController)
      .to(DrinkItemsController)
      .inSingletonScope();
    bind<DrinkItemsService>(TYPES.DrinkItemsService)
      .to(DrinkItemsService)
      .inSingletonScope();
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
  databaseModule,
  authContainerModule,
  userContainerModule,
  tablesContainerModule,
  ordersContainerModule,
  paymentsContainerModule,
  reservationsContainerModule,
  foodItemsContainerModule,
  drinkItemsContainerModule,
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
