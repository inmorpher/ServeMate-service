import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ILogger } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import { IExceptionFilter } from './exception.filter.interface';
import { HTTPError } from './http-error.class';

/**
 * ExceptionFilter class implements IExceptionFilter to handle and log errors in the application.
 */
@injectable()
export class ExceptionFilter implements IExceptionFilter {
	/**
	 * Creates an instance of ExceptionFilter.
	 * @param logger - The logger service for logging errors.
	 */
	constructor(@inject(TYPES.ILogger) private logger: ILogger) {}

	/**
	 * Catches and handles errors, logging them and sending appropriate responses.
	 *
	 * @param err - The error object to be handled, either a standard Error or an HTTPError.
	 * @param req - The Express request object.
	 * @param res - The Express response object.
	 * @param next - The Express next function.
	 * @returns void
	 */
	catch(err: Error | HTTPError, req: Request, res: Response, next: NextFunction): void {
		if (err instanceof HTTPError) {
			this.logger.error(`[${err.context}] Error ${err.statusCode} : ${err.message}`);
			res.status(err.statusCode).json({ error: err.message });
		} else {
			this.logger.error(`[${req.originalUrl}] Error : ${err.message}`);
			res.status(500).json({ error: 'An unknown error occurred' });
		}
	}
}
