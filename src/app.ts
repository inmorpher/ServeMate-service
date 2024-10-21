import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, json, Router, urlencoded } from 'express';
import { Server } from 'http';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { ENV } from '../env';
import { AuthenticationController } from './controllers/auth/auth.controller';
import { UserController } from './controllers/users/users.controller';
import { IExceptionFilter } from './errors/exception.filter.interface';
import { AuthMiddleware } from './middleware/auth/auth.middleware';
import { ILogger } from './services/logger/logger.service.interface';
import { TYPES } from './types';

@injectable()
export class App {
	app: Express;
	server: Server | null = null;
	port: string | number;
	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.ExceptionFilter) private exceptionFilter: IExceptionFilter,
		@inject(TYPES.AuthMiddleware) private authMiddleware: AuthMiddleware,
		@inject(TYPES.AuthenticationController) private authController: AuthenticationController,
		@inject(TYPES.UserController) private userController: UserController
	) {
		this.app = express();
		this.port = ENV.PORT || 3000;
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
	}

	private useRoutes(): void {
		const apiRouter = Router();

		apiRouter.use('/auth', this.authController.router);
		apiRouter.use('/users', this.userController.router);

		this.app.use(cors());
		this.app.use(cookieParser());
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
