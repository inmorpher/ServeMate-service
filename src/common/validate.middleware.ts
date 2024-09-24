import { NextFunction, Request, Response } from 'express';
import { injectable } from 'inversify';
import { z } from 'zod';
import { IMiddleware } from './middleware.interface';

/**
 * Middleware for validating request query parameters using a Zod schema.
 */
@injectable()
export class ValidateMiddleware implements IMiddleware {
	/**
	 * Creates an instance of ValidateMiddleware.
	 * @param schema - The Zod schema to use for validation.
	 */
	constructor(private schema: z.ZodType) {}

	/**
	 * Executes the middleware to validate the request query.
	 * If validation fails, it sends a 422 status with error details.
	 * If validation succeeds, it calls the next middleware.
	 *
	 * @param param0 - The Express request object (destructured to get query).
	 * @param res - The Express response object.
	 * @param next - The Express next function to call the next middleware.
	 * @returns void
	 */
	execute({ query }: Request, res: Response, next: NextFunction): void {
		const result = this.schema.safeParse(query);
		if (!result.success) {
			res.status(422).send(result.error.issues);
		} else {
			next();
		}
	}
}
