import { UserRole } from '@servemate/dto';
import { IMiddleware } from '../common/middleware.interface';
import { RoleMiddleware } from '../middleware/role/role.middleware';

/**
 * A decorator that specifies which user roles are allowed to access a route.
 * This decorator should be used in combination with HTTP method decorators.
 *
 * @param roles - An array of UserRole values that are allowed to access the route
 * @returns A MethodDecorator that adds role-based access control to the route
 *
 * @example
 * ```typescript
 * class MyController {
 *   @Get('/admin-only')
 *   @Roles([UserRole.ADMIN])
 *   adminMethod() {
 *     // Only admins can access this
 *   }
 * }
 * ```
 */
export const Roles = (roles: UserRole[]): MethodDecorator => {
	return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
		// Get existing middlewares or initialize empty array
		const existingMiddlewares: IMiddleware[] =
			Reflect.getMetadata('middlewares', target, propertyKey) || [];

		// Add RoleMiddleware to the beginning of middlewares array
		const middlewares = [new RoleMiddleware(roles), ...existingMiddlewares];

		// Update the middlewares metadata
		Reflect.defineMetadata('middlewares', middlewares, target, propertyKey);

		return descriptor;
	};
};
