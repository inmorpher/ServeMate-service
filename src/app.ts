import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, json, Router, urlencoded } from 'express';
import { Server } from 'http';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { ENV } from '../env';
import { BaseController } from './common/base.controller';
import { IMiddleware } from './common/middleware.interface';

import { METADATA_KEYS, RouteDefinition } from './decorators/httpDecorators';
import { DrinkItemsController } from './drink-items/drink-items.controller';
import { IExceptionFilter } from './errors/exception.filter.interface';
import { FoodItemsController } from './food-items/food-items.controller';
import { OrdersController } from './orders/orders.controller';
import { PaymentsController } from './payments/payments.controller';
import { ReservationsController } from './reservations/reservations.controller';
import { TablesController } from './tables/tables.controller';

import { AuthenticationController } from './auth/auth.controller';

import { AuthMiddleware } from './auth/auth.middleware';
import { ILogger } from './logger/logger.service.interface';
import { openApiRouter } from './openapi/swagger';
import { TYPES } from './types';
import { IUsersController } from './users/users.controller.interface';
import { IWebSocketGateway } from './websocket/websocket.gateway';
import { WorkspaceController } from './workspace/workspace.controller';

@injectable()
export class App {
  app: Express;
  server: Server | null = null;
  port: string | number;
  private controllers: BaseController[];

  constructor(
    @inject(TYPES.ILogger) private logger: ILogger,
    @inject(TYPES.ExceptionFilter) private exceptionFilter: IExceptionFilter,
    @inject(TYPES.AuthMiddleware) private authMiddleware: AuthMiddleware,
    @inject(TYPES.WebSocketGateway)
    private websocketGateway: IWebSocketGateway,
    @inject(TYPES.AuthenticationController)
    private authController: AuthenticationController,
    @inject(TYPES.UsersController) private usersController: IUsersController,
    @inject(TYPES.TablesController) private tablesController: TablesController,
    @inject(TYPES.OrdersController) private ordersController: OrdersController,
    @inject(TYPES.PaymentsController)
    private paymentController: PaymentsController,
    @inject(TYPES.ReservationsController)
    private reservationController: ReservationsController,
    @inject(TYPES.FoodItemsController)
    private foodItemsController: FoodItemsController,
    @inject(TYPES.DrinkItemsController)
    private drinkItemsController: DrinkItemsController,
    @inject(TYPES.WorkspaceController)
    private workspaceController: WorkspaceController
  ) {
    this.app = express();
    this.port = ENV.PORT || 3000;
    this.controllers = [
      this.authController,
      this.usersController,
      this.tablesController,
      this.ordersController,
      this.paymentController,
      this.reservationController,
      this.foodItemsController,
      this.drinkItemsController,
      this.workspaceController,
    ];
  }

  private useMiddlewares(): void {
    this.app.use(compression());
    this.app.use(json());
    this.app.use(urlencoded({ extended: true }));
    this.app.use((req, res, next) => {
      res.setHeader(
        'Permission-Policy',
        'geolocation=(), microphone=(), camera=()'
      );
      next();
    });

    this.app.use(
      cors({
        origin: [
          'http://localhost:3000',
          'http://192.168.2.60:3000',
          'http://192.168.2.60:3002',
          'http://localhost:3002',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
          'Origin',
          'Access-Control-Allow-Headers',
        ],
        exposedHeaders: ['X-Access-Token', 'X-Refresh-Token', 'Set-Cookie'],
      })
    );

    this.app.use(cookieParser());

    this.app.use('/api', (req, res, next) => {
      if (req.method === 'OPTIONS') {
        return next();
      }

      if (
        req.path.startsWith('/auth/login') ||
        req.path.startsWith('/auth/refresh-token') ||
        req.path.includes('/meta')
      ) {
        return next();
      }

      this.authMiddleware.execute(req, res, next);
    });
  }

  private useRoutes(): void {
    const apiRouter = Router();

    this.controllers.forEach(controller => {
      const prefix = Reflect.getMetadata(
        METADATA_KEYS.PREFIX,
        controller.constructor
      );
      const routes = Reflect.getMetadata(
        METADATA_KEYS.ROUTES,
        controller.constructor
      );
      const methods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(controller)
      );

      if (!prefix) {
        this.logger.warn(`No prefix found for ${controller.constructor.name}`);
        return;
      }

      if (!controller.router) {
        this.logger.warn(`No router found for ${controller.constructor.name}`);
        return;
      }

      if (routes) {
        this.logger.log(
          `\x1b[33m...\x1b[0m Controller ${controller.constructor.name} is mounting at /api${prefix}`
        );
        routes.forEach((route: RouteDefinition) => {
          const handler = (controller as any)[route.handlerName].bind(
            controller
          );
          if (route.middlewares && route.middlewares.length > 0) {
            const middlewares = route.middlewares.map((m: IMiddleware) =>
              m.execute.bind(m)
            );
            apiRouter[route.method](
              prefix + route.path,
              ...middlewares,
              handler
            );
          } else {
            apiRouter[route.method](prefix + route.path, handler);
          }
          this.logger.log(
            `\t\x1b[32m + \x1b[0m Route: [${route.method.toUpperCase()}] ${prefix}${
              route.path
            } bounded successfully`
          );
        });
      } else {
        this.logger.warn(`No routes found for ${controller.constructor.name}`);
      }

      this.logger.log(
        `\x1b[32m✓\x1b[0m Controller ${controller.constructor.name} mounted at /api${prefix}`
      );
    });

    this.app.use('/api', apiRouter);
    this.app.use('/docs', openApiRouter);
  }

  private useExceptionFilters(): void {
    this.app.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
  }

  public async init() {
    this.useMiddlewares();
    this.useRoutes();
    this.useExceptionFilters();
    this.server = this.app.listen(this.port);
    this.websocketGateway.initialize(this.server);
    this.logger.log(`Server is running on port ${this.port}`);
  }
}
