import cors from 'cors';
import express, { Express, json, urlencoded } from 'express';
import { Server } from 'http';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { ENV } from '../env';
import { UserController } from './controllers/users/users.controller';
import { IExceptionFilter } from './errors/exception.filter.interface';
import { ILogger } from './services/logger/logger.service.interface';
import { TYPES } from './types';

/**
 * Initializes the Express application.
 *
 * @returns void
 */
@injectable()
export class App {
	app: Express;
	server: Server | null = null;
	port: string | number;
	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.ExceptionFilter) private exceptionFilter: IExceptionFilter,
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
	}

	private useRoutes(): void {
		this.app.use(cors());
		this.app.use('/api', this.userController.router);
	}

	private useExceptionFilters(): void {
		this.app.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
	}

	public async init() {
		this.useMiddlewares();
		this.useRoutes();
		this.useExceptionFilters();
		this.server = this.app.listen(this.port);
		this.logger.setContext('App');
		this.logger.log(`Server is running on port ${this.port}`);
	}
}
