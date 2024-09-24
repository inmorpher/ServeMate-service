import { NextFunction, Request, Response, Router } from 'express';
import { IMiddleware } from './middleware.interface';

/**
 * Represents the structure of a controller route in the application.
 * This interface defines the properties needed to set up a route in an Express.js application.
 */
export interface IControllerRoute {
	/**
	 * The URL path for the route.
	 */
	path: string;

	/**
	 * The function to be executed when the route is accessed.
	 * @param req - The Express Request object.
	 * @param res - The Express Response object.
	 * @param next - The Express NextFunction for passing control to the next middleware.
	 */
	func: (req: Request, res: Response, next: NextFunction) => void;

	/**
	 * The HTTP method for the route.
	 * Limited to 'get', 'post', 'put', 'patch', or 'delete'.
	 */
	method: keyof Pick<Router, 'get' | 'post' | 'put' | 'patch' | 'delete'>;

	/**
	 * Optional array of middleware functions to be executed before the main route handler.
	 */
	middlewares?: IMiddleware[];
}
