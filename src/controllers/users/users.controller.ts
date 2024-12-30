import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../../common/base.controller';
import { TypedRequest } from '../../common/route.interface';
import { Role } from '../../dto/enums';
import {
	CreateUser,
	CreateUserSchema,
	IdParamSchema,
	UpdateUserDto,
	UpdateUserSchema,
	UserListResult,
	UserParamSchema,
	UserSearchCriteria,
	UserSortColumn,
} from '../../dto/user.dto';
import { CacheMiddleware } from '../../middleware/cache/cache.middleware';
import { RoleMiddleware } from '../../middleware/role/role.middleware';
import { ValidateMiddleware } from '../../middleware/validate/validate.middleware';
import { ILogger } from '../../services/logger/logger.service.interface';
import { UserService } from '../../services/users/user.service';
import { TYPES } from '../../types';
import { IUserController } from './user.controller.interface';

@injectable()
export class UserController extends BaseController implements IUserController {
	private cacheMiddleware: CacheMiddleware;
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.UserService) private userService: UserService
	) {
		super(loggerService);
		this.cacheMiddleware = new CacheMiddleware(this.cache, 'users');
		this.bindRoutes([
			{
				method: 'get',
				path: '/',
				func: this.getUsers,
				middlewares: [new ValidateMiddleware(UserParamSchema, 'query'), this.cacheMiddleware],
			},
			{
				method: 'post',
				path: '/',
				func: this.createUser,
				middlewares: [
					new RoleMiddleware([Role.ADMIN, Role.MANAGER]),
					new ValidateMiddleware(CreateUserSchema, 'body'),
					this.cacheMiddleware,
				],
			},
			{
				method: 'delete',
				path: '/:id',
				func: this.deleteUser,
				middlewares: [
					new RoleMiddleware([Role.ADMIN, Role.MANAGER]),
					new ValidateMiddleware(IdParamSchema, 'params'),
					this.cacheMiddleware,
				],
			},
			{
				method: 'put',
				path: '/:id',
				func: this.updateUser,
				middlewares: [
					new RoleMiddleware([Role.ADMIN, Role.MANAGER]),
					new ValidateMiddleware(IdParamSchema, 'params'),
					new ValidateMiddleware(UpdateUserSchema, 'body'),
					this.cacheMiddleware,
				],
			},
		]);
	}

	/**
	 * Retrieves users based on the provided query parameters.
	 *
	 * @param {Request} req - The Express request object containing query parameters.
	 * @param {Response} res - The Express response object used to send the result.
	 * @param {NextFunction} next - The Express next middleware function for error handling.
	 *
	 * @param {number} [req.query.id] - The user ID to filter by.
	 * @param {string} [req.query.email] - The email to filter by.
	 * @param {string} [req.query.name] - The name to filter by.
	 * @param {number} [req.query.page=1] - The page number for pagination.
	 * @param {number} [req.query.pageSize=10] - The number of items per page.
	 * @param {UserSortColumn} [req.query.sortBy='name'] - The column to sort by.
	 * @param {'asc' | 'desc'} [req.query.sortOrder='asc'] - The sort order.
	 * @param {Role} [req.query.role] - The role to filter by.
	 * @param {boolean} [req.query.isActive] - The active status to filter by.
	 * @param {string} [req.query.createdAfter] - The date to filter users created after.
	 * @param {string} [req.query.createdBefore] - The date to filter users created before.
	 *
	 * @returns {Promise<void>} Sends a JSON response with the retrieved users if successful.
	 *                          If an error occurs, it's passed to the next middleware for handling.
	 */
	async getUsers(
		req: TypedRequest<{}, UserSearchCriteria, {}>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const {
				id,
				email,
				name,
				page,
				pageSize,
				sortBy,
				sortOrder,
				role,
				isActive,
				createdAfter,
				createdBefore,
			} = req.query;

			const queryParams: UserSearchCriteria = {
				...(id && { id: Number(id) }),
				...(email && { email: email as string }),
				...(name && { name: name as string }),
				...(role && { role: role as Role }),
				...(isActive !== undefined && { isActive: isActive === true }),
				...(createdAfter && { createdAfter: createdAfter as string }),
				...(createdBefore && { createdBefore: createdBefore as string }),
				...(page && { page: Number(page) }),
				...(pageSize && { pageSize: Number(pageSize) }),
				...(sortBy && { sortBy: sortBy as UserSortColumn }),
				...(sortOrder && { sortOrder: sortOrder as 'asc' | 'desc' }),
			};
			const pageNum = Number(page) || 1;
			const pageSizeNum = Number(pageSize) || 10;
			const sortByStr = (sortBy as string) || 'name';
			const sortOrderStr = (sortOrder as 'asc' | 'desc') || 'asc';

			const result: UserListResult = await this.userService.findUsers(
				queryParams,
				pageNum,
				pageSizeNum,
				sortByStr,
				sortOrderStr
			);

			this.ok(res, result);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Creates a new user in the database.
	 *
	 * @param {Request} req - The Express request object containing the new user data in the request body.
	 * @param {Response} res - The Express response object used to send the success message.
	 * @param {NextFunction} next - The Express next middleware function for error handling.
	 *
	 * @param {string} req.body.name - The name of the new user.
	 * @param {string} req.body.email - The email of the new user.
	 * @param {string} req.body.role - The role of the new user.
	 * @param {string} req.body.password - The password of the new user.
	 *
	 * @returns {Promise<void>} Sends a JSON response with a success message if the user is created successfully.
	 *                          If an error occurs during the process, it's passed to the next middleware for error handling.
	 */
	async createUser(req: TypedRequest<{}, {}, CreateUser>, res: Response, next: NextFunction) {
		try {
			const newUser = await this.userService.createUser({
				name: req.body.name,
				email: req.body.email,
				role: req.body.role,
				password: req.body.password,
			});

			const message = `User ${newUser.name.toUpperCase()} ${newUser.email.toLowerCase()} created successfully`;

			this.loggerService.log(message);
			this.ok(res, message);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Deletes a user from the database based on the provided user ID.
	 *
	 * @param {Request} req - The Express request object containing the user ID in the request params.
	 * @param {Response} res - The Express response object used to send the success message.
	 * @param {NextFunction} next - The Express next middleware function for error handling.
	 *
	 * @param {number} req.params.id - The ID of the user to be deleted.
	 *
	 * @returns {Promise<void>} Sends a JSON response with a success message if the user is deleted successfully.
	 *                          If an error occurs during the process, it's passed to the next middleware for error handling.
	 */
	async deleteUser(req: TypedRequest<{ id: string | number }>, res: Response, next: NextFunction) {
		const userId = typeof req.params.id === 'string' ? parseInt(req.params.id, 10) : req.params.id;

		try {
			await this.userService.deleteUser(userId);
			this.ok(res, `User with ID ${userId} deleted successfully`);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Updates a user in the database based on the provided user ID and update data.
	 *
	 * @param {Request} req - The Express request object containing the user ID in the request params and the update data in the request body.
	 * @param {Response} res - The Express response object used to send the success message.
	 * @param {NextFunction} next - The Express next middleware function for error handling.
	 *
	 * @param {number} req.params.id - The ID of the user to be updated.
	 * @param {object} req.body - The update data for the user.
	 *
	 * @returns {Promise<void>} Sends a JSON response with a success message if the user is updated successfully.
	 *                          If an error occurs during the process, it's passed to the next middleware for error handling.
	 */
	async updateUser(
		req: TypedRequest<{ id: number | string }, {}, UpdateUserDto>,
		res: Response,
		next: NextFunction
	) {
		try {
			const userId =
				typeof req.params.id === 'string' ? parseInt(req.params.id, 10) : req.params.id;
			const updateData = req.body;

			await this.userService.updateUser(userId, updateData);

			this.ok(res, `User with ID ${userId} updated successfully`);
		} catch (error) {
			next(error);
		}
	}
}
