import { NextFunction, Request, Response, Router } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { IMiddleware } from './middleware.interface';

/**
 * Extends the Express Request interface to provide typed parameters, query, and body.
 * This interface allows for better type checking and autocompletion when working with Express requests.
 *
 * @template TParams - The type for route parameters (defaults to an empty object)
 * @template TQuery - The type for query parameters (defaults to an empty object)
 * @template TBody - The type for request body (defaults to an empty object)
 *
 * @extends {Request} - Extends the Express Request interface
 */
export interface TypedRequest<TParams = {}, TQuery = {}, TBody = {}> extends Request {
	/** The typed request body */
	body: TBody;
	/** The typed query parameters, merged with ParsedQs for compatibility with Express */
	query: TQuery & ParsedQs;
	/** The typed route parameters, merged with ParamsDictionary for compatibility with Express */
	params: TParams & ParamsDictionary;
}

/**
 * Represents the structure of a controller route in the application.
 * This interface defines the properties needed to set up a route in an Express.js application.
 */
export interface IControllerRoute<TParams, TQuery, TBody> {
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
	func: (req: TypedRequest<TParams, TQuery, TBody>, res: Response, next: NextFunction) => void;

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
