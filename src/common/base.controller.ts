import { CookieOptions, Response, Router } from 'express';
import { inject, injectable } from 'inversify';
import NodeCache from 'node-cache';
import 'reflect-metadata';
import { RouteDefinition } from '../decorators/httpDecorators';
import { ILogger } from '../services/logger/logger.service.interface';
import { TYPES } from '../types';

@injectable()
export abstract class BaseController {
	public router: Router;
	private readonly _cache: NodeCache;
	private context: string;

	constructor(@inject(TYPES.ILogger) private logger: ILogger) {
		this.router = Router();
		this.context = this.constructor.name;
		this._cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
	}

	get cache(): NodeCache {
		return this._cache;
	}

	/**
	 * Sends a JSON response with the specified status code.
	 * @param res - The Express Response object.
	 * @param code - The HTTP status code to send.
	 * @param message - The message or data to send in the response body.
	 * @returns The Express Response object.
	 */
	public send<T>(res: Response, code: number, message: T) {
		res.type('application/json');
		return res.status(code).json(message);
	}

	/**
	 * Sends a successful (200 OK) response with the provided message.
	 * @param res - The Express Response object.
	 * @param message - The message or data to send in the response body.
	 * @returns The Express Response object.
	 */
	public ok<T>(res: Response, message: T) {
		return this.send<T>(res, 200, message);
	}

	/**
	 * Sets a cookie in the response.
	 * @param res - The Express Response object.
	 * @param key - The name of the cookie.
	 * @param value - The value to be stored in the cookie.
	 * @param options - Optional cookie options.
	 * @returns The Express Response object.
	 */
	public cookie<T>(res: Response, key: string, value: T, options?: CookieOptions) {
		const cookieValue = typeof value === 'object' ? JSON.stringify(value) : value;
		return res.cookie(key, cookieValue, options || {});
	}

	/**
	 * Sends a 201 Created status response.
	 * @param res - The Express Response object.
	 * @returns The Express Response object.
	 */
	public created(res: Response) {
		return res.sendStatus(201);
	}

	/**
	 * Sends a 204 No Content status response.
	 * @param res - The Express Response object.
	 * @returns The Express Response object.
	 */
	public noContent(res: Response) {
		return res.sendStatus(204);
	}

	/**
	 * Sends a 400 Bad Request response with an optional message.
	 * @param res - The Express Response object.
	 * @param message - The error message (default: 'Bad Request').
	 * @returns The Express Response object.
	 */
	public badRequest(res: Response, message: string = 'Bad Request') {
		return this.send(res, 400, { message });
	}

	/**
	 * Sends a 401 Unauthorized response with an optional message.
	 * @param res - The Express Response object.
	 * @param message - The error message (default: 'Unauthorized').
	 * @returns The Express Response object.
	 */
	public unauthorized(res: Response, message: string = 'Unauthorized') {
		return this.send(res, 401, { message });
	}

	/**
	 * Sends a 403 Forbidden response with an optional message.
	 * @param res - The Express Response object.
	 * @param message - The error message (default: 'Forbidden').
	 * @returns The Express Response object.
	 */
	public forbidden(res: Response, message: string = 'Forbidden') {
		return this.send(res, 403, { message });
	}

	/**
	 * Sends a 404 Not Found response with an optional message.
	 * @param res - The Express Response object.
	 * @param message - The error message (default: 'Not Found').
	 * @returns The Express Response object.
	 */
	public notFound(res: Response, message: string = 'Not Found') {
		return this.send(res, 404, { message });
	}

	/**
	 * Sends a 500 Internal Server Error response with an optional message.
	 * @param res - The Express Response object.
	 * @param message - The error message (default: 'Internal Server Error').
	 * @returns The Express Response object.
	 */
	public internalServerError(res: Response, message: string = 'Internal Server Error') {
		return this.send(res, 500, { message });
	}

	protected bindRoutes() {
		const prefix = Reflect.getMetadata('prefix', this.constructor) || '';
		const routes: RouteDefinition[] = Reflect.getMetadata('routes', this.constructor) || [];

		routes.forEach((route: RouteDefinition) => {
			if (!route || !route.handlerName) {
				this.logger.warn(`Invalid route definition: ${JSON.stringify(route)}`);
				return;
			}

			const handler = (this as any)[route.handlerName].bind(this);

			if (route.middlewares && route.middlewares.length > 0) {
				const middlewares = route.middlewares.map((m: any) => m.execute.bind(m));
				this.router[route.method](prefix + route.path, ...middlewares, handler);
				this.logger.debug(
					`Registered route: ${route.method.toUpperCase()} ${prefix + route.path} with ${
						middlewares.length
					} middleware(s)`
				);
			} else {
				this.router[route.method](prefix + route.path, handler);
				this.logger.debug(`Registered route: ${route.method.toUpperCase()} ${prefix + route.path}`);
			}
		});
	}
}
