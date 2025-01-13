import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, json, Router, urlencoded } from 'express';
import { Server } from 'http';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { ENV } from '../env';
import { BaseController } from './common/base.controller';
import { BaseService } from './common/base.service';
import { IMiddleware } from './common/middleware.interface';
import { AuthenticationController } from './controllers/auth/auth.controller';
import { OrdersController } from './controllers/orders/orders.controller';
import { ITableController } from './controllers/tables/table.controller.interface';
import { IUserController } from './controllers/users/user.controller.interface';
import { METADATA_KEYS, RouteDefinition } from './deсorators/httpDecorators';
import { IExceptionFilter } from './errors/exception.filter.interface';
import { AuthMiddleware } from './middleware/auth/auth.middleware';
import { ILogger } from './services/logger/logger.service.interface';
import { TYPES } from './types';

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
		@inject(TYPES.AuthenticationController) private authController: AuthenticationController,
		//TODO :Add types for other controllers
		@inject(TYPES.UserController) private userController: IUserController,
		@inject(TYPES.TableController) private tableController: ITableController,
		//Orders
		@inject(TYPES.OrdersController) private ordersController: OrdersController,
		// Other
		@inject(TYPES.BaseService) private baseService: BaseService
	) {
		this.app = express();
		this.port = ENV.PORT || 3000;
		this.controllers = [
			this.authController,
			this.userController,
			this.tableController,
			this.ordersController,
		];
	}

	private useMiddlewares(): void {
		this.app.use(json());
		this.app.use(urlencoded({ extended: true }));
		this.app.use((req, res, next) => {
			res.setHeader('Permission-Policy', 'geolocation=(), microphone=(), camera=()');
			next();
		});

		if (ENV.PRODUCTION) {
			this.app.use('/api', (req, res, next) => {
				if (req.path.startsWith('/auth')) {
					return next();
				}
				this.authMiddleware.execute(req, res, next);
			});
		}

		this.app.use(cors());
		this.app.use(cookieParser());
	}

	private useRoutes(): void {
		const apiRouter = Router();

		this.controllers.forEach((controller) => {
			const prefix = Reflect.getMetadata(METADATA_KEYS.PREFIX, controller.constructor);
			const routes = Reflect.getMetadata(METADATA_KEYS.ROUTES, controller.constructor);
			const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));

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
					const handler = (controller as any)[route.handlerName].bind(controller);
					if (route.middlewares && route.middlewares.length > 0) {
						const middlewares = route.middlewares.map((m: IMiddleware) => m.execute.bind(m));
						apiRouter[route.method](prefix + route.path, ...middlewares, handler);

						this.logger.log(
							`\t\x1b[32m + \x1b[0m Route: [${route.method.toUpperCase()}] ${prefix}${
								route.path
							} bounded successfully`
						);
					} else {
						apiRouter[route.method](prefix + route.path, handler);
					}
				});
			} else {
				this.logger.warn(`No routes found for ${controller.constructor.name}`);
			}

			this.logger.log(
				`\x1b[32m✓\x1b[0m Controller ${controller.constructor.name} mounted at /api${prefix}`
			);
		});

		this.app.use('/api', apiRouter);
	}

	private useExceptionFilters(): void {
		this.app.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
	}

	public async init() {
		this.useMiddlewares();
		this.useRoutes();
		this.useExceptionFilters();
		this.server = this.app.listen(this.port);
		this.logger.log(`Server is running on port ${this.port}`);
	}
}
