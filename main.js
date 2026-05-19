"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.appContainer = exports.app = exports.appBindings = exports.drinkItemsModule = exports.foodItemsModule = exports.reservationsModule = exports.paymentModule = exports.ordersModule = exports.tablesModule = exports.baseModules = exports.appModule = exports.userModule = exports.authModule = exports.coreServicesModule = void 0;
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const inversify_1 = require("inversify");
require("reflect-metadata");
const app_1 = require("./src/app");
const base_service_1 = require("./src/common/base.service");
const auth_controller_1 = require("./src/controllers/auth/auth.controller");
const drink_items_controller_1 = require("./src/controllers/drinkItems/drink-items.controller");
const food_items_controller_1 = require("./src/controllers/foodItems/food-items.controller");
const orders_controller_1 = require("./src/controllers/orders/orders.controller");
const payment_controller_1 = require("./src/controllers/payments/payment.controller");
const reservation_controller_1 = require("./src/controllers/reservations/reservation.controller");
const table_controller_1 = require("./src/controllers/tables/table.controller");
const users_controller_1 = require("./src/controllers/users/users.controller");
const exception_filter_1 = require("./src/errors/exception.filter");
const auth_middleware_1 = require("./src/middleware/auth/auth.middleware");
const drink_items_service_1 = require("./src/services/drinks/drink-items.service");
const food_items_service_1 = require("./src/services/food/food-items.service");
const logger_service_1 = require("./src/services/logger/logger.service");
const order_service_1 = require("./src/services/orders/order.service");
const payment_service_1 = require("./src/services/payment/payment.service");
const reservation_service_1 = require("./src/services/reservations/reservation.service");
const table_service_1 = require("./src/services/tables/table.service");
const token_service_1 = require("./src/services/tokens/token.service");
const user_service_1 = require("./src/services/users/user.service");
const websocket_service_1 = require("./src/services/webSocket/websocket.service");
const types_1 = require("./src/types");
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
exports.coreServicesModule = new inversify_1.ContainerModule(({ bind }) => {
    bind(types_1.TYPES.ILogger).to(logger_service_1.LoggerService).inSingletonScope();
    bind(types_1.TYPES.ExceptionFilter).to(exception_filter_1.ExceptionFilter).inSingletonScope();
    bind(types_1.TYPES.ITokenService).to(token_service_1.TokenService).inSingletonScope();
    bind(types_1.TYPES.WebSocketService).to(websocket_service_1.WebSocketService).inSingletonScope();
    // Prisma 7 с адаптером PostgreSQL
    const connectionString = process.env.DATABASE_URL;
    const adapter = new adapter_pg_1.PrismaPg(connectionString !== null && connectionString !== void 0 ? connectionString : '');
    bind(types_1.TYPES.PrismaClient).toConstantValue(new client_1.PrismaClient({
        adapter,
        log: [
            {
                emit: 'stdout',
                level: 'info',
            },
        ],
    }));
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
exports.authModule = new inversify_1.ContainerModule(({ bind }) => {
    bind(types_1.TYPES.AuthMiddleware).to(auth_middleware_1.AuthMiddleware).inSingletonScope();
    bind(types_1.TYPES.AuthenticationController)
        .to(auth_controller_1.AuthenticationController)
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
exports.userModule = new inversify_1.ContainerModule(({ bind }) => {
    bind(types_1.TYPES.UserService).to(user_service_1.UserService).inSingletonScope();
    bind(types_1.TYPES.UserController).to(users_controller_1.UserController).inSingletonScope();
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
exports.appModule = new inversify_1.ContainerModule(({ bind }) => {
    bind(types_1.TYPES.Application).to(app_1.App).inSingletonScope();
});
/**
 * Container module that binds the `BaseService` to the `TYPES.BaseService` identifier.
 * The `BaseService` is bound in a singleton scope, meaning that only one instance of
 * `BaseService` will be created and shared throughout the application.
 *
 * @param bind - The bind function used to bind the service to the identifier.
 */
exports.baseModules = new inversify_1.ContainerModule(({ bind }) => {
    bind(types_1.TYPES.BaseService).to(base_service_1.BaseService).inSingletonScope();
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
exports.tablesModule = new inversify_1.ContainerModule(({ bind }) => {
    bind(types_1.TYPES.TableService).to(table_service_1.TableService).inSingletonScope();
    bind(types_1.TYPES.TableController).to(table_controller_1.TableController).inSingletonScope();
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
exports.ordersModule = new inversify_1.ContainerModule(({ bind }) => {
    bind(types_1.TYPES.OrdersService).to(order_service_1.OrdersService).inSingletonScope();
    bind(types_1.TYPES.OrdersController).to(orders_controller_1.OrdersController).inSingletonScope();
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
exports.paymentModule = new inversify_1.ContainerModule(({ bind }) => {
    bind(types_1.TYPES.PaymentService).to(payment_service_1.PaymentService).inSingletonScope();
    bind(types_1.TYPES.PaymentController).to(payment_controller_1.PaymentController).inSingletonScope();
});
/**
 * @module reservationsModule
 *
 * @description This module configures dependency injection for reservation-related components.
 *
 * In particular, it:
 * - Binds the ReservationService to its corresponding DI token (TYPES.ReservationService) in singleton scope.
 * - Binds the ReservationController to its DI token (TYPES.ReservationController) in singleton scope.
 *
 * The use of singleton scope ensures that only one instance of each service is created and reused
 * throughout the application's lifecycle.
 *
 * @remarks
 * This module leverages InversifyJS for managing dependencies, enabling modular and testable architecture.
 */
exports.reservationsModule = new inversify_1.ContainerModule(({ bind }) => {
    bind(types_1.TYPES.ReservationService).to(reservation_service_1.ReservationService).inSingletonScope();
    bind(types_1.TYPES.ReservationController)
        .to(reservation_controller_1.ReservationController)
        .inSingletonScope();
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
exports.foodItemsModule = new inversify_1.ContainerModule(({ bind }) => {
    bind(types_1.TYPES.FoodItemsController).to(food_items_controller_1.FoodItemsController).inSingletonScope();
    bind(types_1.TYPES.FoodItemsService).to(food_items_service_1.FoodItemsService).inSingletonScope();
});
exports.drinkItemsModule = new inversify_1.ContainerModule(({ bind }) => {
    bind(types_1.TYPES.DrinkItemsController)
        .to(drink_items_controller_1.DrinkItemsController)
        .inSingletonScope();
    bind(types_1.TYPES.DrinkItemsService).to(drink_items_service_1.DrinkItemsService).inSingletonScope();
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
exports.appBindings = [
    exports.coreServicesModule,
    exports.authModule,
    exports.userModule,
    exports.tablesModule,
    exports.ordersModule,
    exports.paymentModule,
    exports.reservationsModule,
    exports.foodItemsModule,
    exports.drinkItemsModule,
    exports.appModule,
    exports.baseModules,
];
/**
 * Initializes the application by creating a new IoC container, loading the necessary bindings,
 * and starting the application.
 *
 * @returns An object containing the initialized application instance and the IoC container.
 */
const bootstrap = () => {
    const appContainer = new inversify_1.Container();
    appContainer.load(...exports.appBindings);
    const app = appContainer.get(types_1.TYPES.Application);
    app.init();
    return { app, appContainer };
};
_a = bootstrap(), exports.app = _a.app, exports.appContainer = _a.appContainer;
