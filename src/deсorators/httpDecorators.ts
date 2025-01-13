import 'reflect-metadata';
import { IMiddleware } from '../common/middleware.interface';

export const ROUTES_KEY = Symbol('routes');

export interface RouteDefinition {
	path: string;
	method: 'get' | 'post' | 'delete' | 'patch' | 'put';
	handlerName: string;
	middlewares?: IMiddleware[];
}

export const METADATA_KEYS = {
	PREFIX: 'prefix',
	ROUTES: 'routes',
} as const;

export const Controller = (prefix: string): ClassDecorator => {
	return (target) => {
		Reflect.defineMetadata('prefix', prefix, target);
		if (!Reflect.hasMetadata(ROUTES_KEY, target)) {
			Reflect.defineMetadata(ROUTES_KEY, [], target);
		}
	};
};

/**
 * Creates a method decorator for HTTP routes.
 *
 * @param method - The HTTP method for the route (e.g., 'get', 'post', 'delete', 'patch', 'put').
 * @returns A method decorator that registers the route with the specified HTTP method and path.
 *
 * @example
 * ```typescript
 * class MyController {
 *   @createMethodDecorator('get')('/my-route')
 *   myMethod() {
 *     // handler code
 *   }
 * }
 * ```
 *
 * The above example will register `myMethod` as a GET route at the path `/my-route`.
 *
 * @param path - The path for the route.
 * @returns A MethodDecorator function.
 */
const createMethodDecorator = <T>(method: 'get' | 'post' | 'delete' | 'patch' | 'put') => {
	return (path: string): MethodDecorator => {
		return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
			const routes: RouteDefinition[] =
				Reflect.getMetadata(METADATA_KEYS.ROUTES, target.constructor) || [];

			routes.push({
				path,
				method,
				handlerName: propertyKey as string,
				middlewares: [],
			});
			Reflect.defineMetadata(METADATA_KEYS.ROUTES, routes, target.constructor);
			return descriptor;
		};
	};
};
/**
 * A decorator to define an HTTP GET method for a route handler.
 *
 * This decorator can be used to annotate a method in a class to specify that
 * the method should handle HTTP GET requests.
 *
 * @example
 * ```typescript
 * class MyController {
 *   @Get('/path')
 *   public myGetMethod(req: Request, res: Response): void {
 *     res.send('Hello, world!');
 *   }
 * }
 * ```
 *
 * @returns {MethodDecorator} The method decorator for HTTP GET requests.
 */
export const Get = createMethodDecorator<any>('get');
/**
 * A decorator to mark a method as an HTTP POST endpoint.
 *
 * This decorator is used to define a method that handles HTTP POST requests.
 * It is created using the `createMethodDecorator` function with the 'post' method.
 *
 * @example
 * ```typescript
 * class MyController {
 *   @Post
 *   createResource() {
 *     // handle POST request
 *   }
 * }
 * ```
 */
export const Post = createMethodDecorator<any>('post');
/**
 * A decorator to mark a method as an HTTP DELETE endpoint.
 *
 * This decorator is used to indicate that the decorated method should handle
 * HTTP DELETE requests. It is created using the `createMethodDecorator` function
 * with the HTTP method 'delete'.
 *
 * @example
 * ```typescript
 * @Delete('/resource/:id')
 * public async deleteResource(@Param('id') id: string): Promise<void> {
 *   // Implementation for deleting a resource by ID
 * }
 * ```
 */
export const Delete = createMethodDecorator<any>('delete');
export const Patch = createMethodDecorator<any>('patch');
export const Put = createMethodDecorator<any>('put');
