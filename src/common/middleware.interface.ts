import { NextFunction, Request, Response } from 'express';

/**
 * Interface representing a middleware in an Express application.
 */
export interface IMiddleware {
	/**
	 * Executes the middleware function.
	 *
	 * @param req - The Express request object.
	 * @param res - The Express response object.
	 * @param next - The Express next function to pass control to the next middleware.
	 * @returns void
	 */
	execute(req: Request, res: Response, next: NextFunction): void;
}
