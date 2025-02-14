import { PrismaClient } from '@prisma/client';
import { Container, ContainerModule, interfaces } from 'inversify';
import { App } from './src/app';
import { BaseService } from './src/common/base.service';
import { AuthenticationController } from './src/controllers/auth/auth.controller';
import { DrinkItemsController } from './src/controllers/drinkItems/drink-items.controller';
import { FoodItemsController } from './src/controllers/foodItems/food-items.controller';
import { OrdersController } from './src/controllers/orders/orders.controller';
import { PaymentController } from './src/controllers/payments/payment.controller';
import { AbstractPaymentController } from './src/controllers/payments/payment.controller.interface';
import { TableController } from './src/controllers/tables/table.controller';
import { ITableController } from './src/controllers/tables/table.controller.interface';
import { IUserController } from './src/controllers/users/user.controller.interface';
import { UserController } from './src/controllers/users/users.controller';
import { ExceptionFilter } from './src/errors/exception.filter';
import { IExceptionFilter } from './src/errors/exception.filter.interface';
import { AuthMiddleware } from './src/middleware/auth/auth.middleware';
import { RoleMiddleware } from './src/middleware/role/role.middleware';
import { DrinkItemsService } from './src/services/drinks/drink-items.service';
import { FoodItemsService } from './src/services/food/food-items.service';
import { LoggerService } from './src/services/logger/logger.service';
import { ILogger } from './src/services/logger/logger.service.interface';
import { OrdersService } from './src/services/orders/order.service';
import { AbstractPaymentService } from './src/services/payment/abstract-payment.service';
import { PaymentService } from './src/services/payment/payment.service';
import { TableService } from './src/services/tables/table.service';
import { ITableService } from './src/services/tables/table.service.interface';
import { TokenService } from './src/services/tokens/token.service';
import { ITokenService } from './src/services/tokens/token.service.interface';
import { UserService } from './src/services/users/user.service';
import { IUserService } from './src/services/users/user.service.interface';
import { TYPES } from './src/types';

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
 * - RoleMiddleware to RoleMiddleware
 * - PrismaClient to a constant value of a new PrismaClient instance
 */
export const coreServicesModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<ILogger>(TYPES.ILogger).to(LoggerService).inSingletonScope();
	bind<IExceptionFilter>(TYPES.ExceptionFilter).to(ExceptionFilter).inSingletonScope();
	bind<ITokenService>(TYPES.ITokenService).to(TokenService).inSingletonScope();
	bind<RoleMiddleware>(TYPES.RoleMiddleware).to(RoleMiddleware).inSingletonScope();
	bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());
});

/**
 * Container module for authentication-related bindings.
 *
 * This module binds the `AuthMiddleware` and `AuthenticationController`
 * to their respective types in singleton scope.
 *
 * @module authModule
 * @param bind - The bind function used to bind types to implementations.
 */
export const authModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware).inSingletonScope();
	bind<AuthenticationController>(TYPES.AuthenticationController)
		.to(AuthenticationController)
		.inSingletonScope();
});

/**
 * Container module for user-related services and controllers.
 *
 * This module binds the `IUserService` and `IUserController` interfaces to their
 * respective implementations (`UserService` and `UserController`) in a singleton scope.
 *
 * @module userModule
 * @param bind - The bind function used to bind interfaces to implementations.
 */
export const userModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<IUserService>(TYPES.UserService).to(UserService).inSingletonScope();
	bind<IUserController>(TYPES.UserController).to(UserController).inSingletonScope();
});

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
export const appModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<App>(TYPES.Application).to(App).inSingletonScope();
});

/**
 * Container module that binds the `BaseService` to the `TYPES.BaseService` identifier.
 * The `BaseService` is bound in a singleton scope, meaning that only one instance of
 * `BaseService` will be created and shared throughout the application.
 *
 * @param bind - The bind function used to bind the service to the identifier.
 */
export const baseModules = new ContainerModule((bind: interfaces.Bind) => {
	bind<BaseService>(TYPES.BaseService).to(BaseService).inSingletonScope();
});

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
export const tablesModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<ITableService>(TYPES.TableService).to(TableService).inSingletonScope();
	bind<ITableController>(TYPES.TableController).to(TableController).inSingletonScope();
});

/**
 * Container module for the Orders feature.
 *
 * This module binds the `OrdersService` and `OrdersController` to their respective
 * types in the IoC container, ensuring they are instantiated as singletons.
 *
 * @module ordersModule
 * @param bind - The bind function used to bind types to implementations in the IoC container.
 */
export const ordersModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<OrdersService>(TYPES.OrdersService).to(OrdersService).inSingletonScope();
	bind<OrdersController>(TYPES.OrdersController).to(OrdersController).inSingletonScope();
});

/**
 * Container module for the payment service and controller.
 *
 * This module binds the `PaymentService` and `PaymentController` to their respective
 * abstract types in a singleton scope.
 *
 * @module paymentModule
 *
 * @param bind - The bind function used to bind interfaces to their implementations.
 *
 * @example
 * ```typescript
 * import { paymentModule } from './main';
 * import { Container } from 'inversify';
 *
 * const container = new Container();
 * container.load(paymentModule);
 *
 * const paymentService = container.get<AbstractPaymentService>(TYPES.PaymentService);
 * const paymentController = container.get<AbstractPaymentController>(TYPES.PaymentController);
 * ```
 */
export const paymentModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<AbstractPaymentService>(TYPES.PaymentService).to(PaymentService).inSingletonScope();
	bind<AbstractPaymentController>(TYPES.PaymentController).to(PaymentController).inSingletonScope();
});

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
export const foodItemsModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<FoodItemsController>(TYPES.FoodItemsController).to(FoodItemsController).inSingletonScope();
	bind<FoodItemsService>(TYPES.FoodItemsService).to(FoodItemsService).inSingletonScope();
});

export const drinkItemsModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<DrinkItemsController>(TYPES.DrinkItemsController)
		.to(DrinkItemsController)
		.inSingletonScope();
	bind<DrinkItemsService>(TYPES.DrinkItemsService).to(DrinkItemsService).inSingletonScope();
});

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
	authModule,
	userModule,
	tablesModule,
	ordersModule,
	paymentModule,
	foodItemsModule,
	drinkItemsModule,
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
	const app = appContainer.get<App>(TYPES.Application);
	app.init();

	return { app, appContainer };
};

export const { app, appContainer } = bootstrap();
