import { Response, Router } from 'express';
import { inject, injectable } from 'inversify';
import { ILogger } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import { IControllerRoute } from './route.interface';

@injectable()
export abstract class BaseController {
	private readonly _router: Router;
	constructor(@inject(TYPES.ILogger) private logger: ILogger) {
		this._router = Router();
	}

	get router(): Router {
		return this._router;
	}

	public send<T>(res: Response, code: number, message: T) {
		res.type('application/json');
		return res.status(code).json(message);
	}

	public ok<T>(res: Response, message: T) {
		return this.send<T>(res, 200, message);
	}

	public created(res: Response) {
		return res.sendStatus(201);
	}

	public noContent(res: Response) {
		return res.sendStatus(204);
	}

	public badRequest(res: Response, message: string = 'Bad Request') {
		return this.send(res, 400, { message });
	}

	public unauthorized(res: Response, message: string = 'Unauthorized') {
		return this.send(res, 401, { message });
	}

	public forbidden(res: Response, message: string = 'Forbidden') {
		return this.send(res, 403, { message });
	}

	public notFound(res: Response, message: string = 'Not Found') {
		return this.send(res, 404, { message });
	}

	public internalServerError(res: Response, message: string = 'Internal Server Error') {
		return this.send(res, 500, { message });
	}

	protected bindRoutes(routes: IControllerRoute[]) {
		for (const route of routes) {
			this.logger.log(`Binding route: ${route.method.toUpperCase()} ${route.path}`);
			const middleware = route.middlewares?.map((m) => m.execute.bind(m)) ?? [];
			const handler = route.func.bind(this);
			const pipeline = middleware ? [...middleware, handler] : handler;
			this.router[route.method](route.path, pipeline);
		}
	}
}
