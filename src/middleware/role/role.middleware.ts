import { NextFunction, Request, Response } from 'express';
import { injectable } from 'inversify';
import 'reflect-metadata';
import { ENV } from '../../../env';
import { IMiddleware } from '../../common/middleware.interface';
import { UserRole } from '../../dto/enums';

/**
 * Middleware for role-based access control.
 * Checks if the user has the required role to access a resource.
 */
@injectable()
export class RoleMiddleware implements IMiddleware {
	/**
	 * Creates an instance of RoleMiddleware.
	 * @param role - An array of roles that are allowed to access the resource.
	 */
	constructor(private role: UserRole[]) {}

	/**
	 * Executes the middleware.
	 * Checks if the user exists and has the required role.
	 * If not, sends an appropriate error response.
	 *
	 * @param req - The Express request object.
	 * @param res - The Express response object.
	 * @param next - The Express next function.
	 * @returns void
	 */
	execute(req: Request, res: Response, next: NextFunction): void {
		const user = req.user;

		if (!ENV.PRODUCTION) {
			console.log(`Skipping role check for development environment`);
			next();
			return;
		}

		if (!user) {
			res.status(401).send({ error: 'Unauthorized' });
			return;
		}

		if (this.role.length === 0) {
			next();
			return; // No roles specified, allow access regardless of user role.
		}

		if (!this.role.includes(user.role)) {
			res.status(403).send({ error: 'Forbidden' });
			return;
		}

		next();
	}
}
