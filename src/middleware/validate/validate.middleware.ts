import { NextFunction, Request, Response } from 'express';
import { injectable } from 'inversify';
import 'reflect-metadata';
import { z } from 'zod';
import { IMiddleware } from '../../common/middleware.interface';
import { RouteDefinition } from '../../decorators/httpDecorators';

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

/**
 * Middleware function to validate request data using a Zod schema.
 *
 * @param schema - The Zod schema to validate the request data against.
 * @param type - The type of request data to validate (default is 'body').
 *
 * @returns A decorator function that validates the request data and calls the original method if validation passes.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { Validate } from './validate.middleware';
 *
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number().int(),
 * });
 *
 * class MyController {
 *   @Validate(schema)
 *   myMethod(req: Request, res: Response, next: NextFunction) {
 *     // Your method implementation
 *   }
 * }
 * ```
 */

export function Validate(schema: z.ZodType<any>, property: 'body' | 'params' | 'query') {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		Reflect.defineMetadata('validate', { schema, property }, target, propertyKey);
		const routes: RouteDefinition[] = Reflect.getMetadata('routes', target.constructor) || [];
		const route = routes.find((r) => r.handlerName === propertyKey);

		if (route) {
			if (!route.middlewares) {
				route.middlewares = [];
			}

			route.middlewares.push(new ValidateMiddleware(schema, property));
		}
	};
}
