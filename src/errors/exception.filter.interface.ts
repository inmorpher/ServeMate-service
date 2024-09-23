import { NextFunction, Request, Response } from 'express';

/**
 * Interface for exception filters in Express applications.
 */
export interface IExceptionFilter {
	/**
	 * Catches and handles exceptions in the Express middleware chain.
	 *
	 * @param err - The error object caught by the exception filter.
	 * @param req - The Express request object.
	 * @param res - The Express response object.
	 * @param next - The Express next function to pass control to the next middleware.
	 * @returns void
	 */
	catch(err: Error, req: Request, res: Response, next: NextFunction): void;
}
