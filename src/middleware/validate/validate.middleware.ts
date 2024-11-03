import { NextFunction, Request, Response } from 'express';
import { injectable } from 'inversify';
import 'reflect-metadata';
import { z } from 'zod';
import { IMiddleware } from '../../common/middleware.interface';

export type ValidationType = 'body' | 'query' | 'params';
/**
 * Middleware for validating request query parameters using a Zod schema.
 */
@injectable()
export class ValidateMiddleware implements IMiddleware {
	/**
	 * Creates an instance of ValidateMiddleware.
	 * @param schema - The Zod schema to use for validation.
	 */
	constructor(private schema: z.ZodType, private type: ValidationType = 'body') {}

	/**
	 * Executes the middleware to validate the request query.
	 * If validation fails, it sends a 422 status with error details.
	 * If validation succeeds, it calls the next middleware.
	 *
	 * @param param - The Express request object (destructured to get query).
	 * @param res - The Express response object.
	 * @param next - The Express next function to call the next middleware.
	 * @returns void
	 */
	execute(req: Request, res: Response, next: NextFunction): void {
		const dataToValidate = this.getDataToValidate(req);

		try {
			const validatedData = this.schema.parse(dataToValidate);

			req[this.type] = validatedData;
			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				const errorMessages = error.issues.map((issue) => ({
					path: issue.path.join('.'),
					message: issue.message,
				}));
				res.status(422).send(errorMessages);
			} else {
				// console.error('Unexpected error during validation:', error);
				res.status(500).send('Internal Server Error');
			}
		}
	}

	private getDataToValidate(req: Request): unknown {
		switch (this.type) {
			case 'body':
				return req.body;
			case 'query':
				return req.query;
			case 'params':
				return req.params;
			default:
				throw new Error(`Invalid validation type: ${this.type}`);
		}
	}
}
