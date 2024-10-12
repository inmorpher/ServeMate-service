import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../../common/base.controller';
import {
	CreateUserSchema,
	IdParamSchema,
	UpdateUserSchema,
	UserParamSchema,
	UserQueryParamDto,
} from '../../dto/user.dto';
import { AuthMiddleware } from '../../middleware/auth/auth.middleware';
import { CacheMiddleware } from '../../middleware/cache/cache.middleware';
import { ValidateMiddleware } from '../../middleware/validate/validate.middleware';
import { ILogger } from '../../services/logger/logger.service.interface';
import { UserService } from '../../services/users/user.service';
import { TYPES } from '../../types';
import { IUserController } from './user.controller.interface';

@injectable()
export class UserController extends BaseController implements IUserController {
	private cacheMiddleware: CacheMiddleware;
	private authMiddleware: AuthMiddleware;
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.UserService) private userService: UserService
	) {
		super(loggerService);
		this.cacheMiddleware = new CacheMiddleware(this.cache, 'users');
		this.authMiddleware = new AuthMiddleware();
		this.bindRoutes([
			{
				method: 'get',
				path: '/',
				func: this.getAllUsers,
				middlewares: [],
			},
			{
				method: 'get',
				path: '/search',
				func: this.getUser,
				middlewares: [new ValidateMiddleware(UserParamSchema, 'query'), this.cacheMiddleware],
			},
			{
				method: 'post',
				path: '/',
				func: this.createUser,
				middlewares: [new ValidateMiddleware(CreateUserSchema, 'body'), this.cacheMiddleware],
			},
			{
				method: 'delete',
				path: '/:id',
				func: this.deleteUser,
				middlewares: [new ValidateMiddleware(IdParamSchema, 'params'), this.cacheMiddleware],
			},
			{
				method: 'put',
				path: '/:id',
				func: this.updateUser,
				middlewares: [
					new ValidateMiddleware(IdParamSchema, 'params'),
					new ValidateMiddleware(UpdateUserSchema, 'body'),
					this.cacheMiddleware,
				],
			},
		]);
	}

	/**
	 * Retrieves all users from the database.
	 *
	 * This method fetches all user records using the userService and sends them
	 * as a response. If an error occurs during the process, it's passed to the
	 * next middleware for error handling.
	 *
	 * @param {Request} req - The Express request object.
	 * @param {Response} res - The Express response object used to send the list of users.
	 * @param {NextFunction} next - The Express next middleware function for error handling.
	 *
	 *  * @example
	 * // GET /users/all
	 *
	 * @returns {Promise<void>} A promise that resolves when the operation is complete.
	 *                          The actual user data is sent via the response object.
	 */
	async getAllUsers(req: Request, res: Response, next: NextFunction) {
		try {
			const users = await this.userService.findAllUsers();
			this.ok(res, users);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Retrieves a user based on the provided query parameters.
	 *
	 * @param {Request} req - The Express request object containing query parameters.
	 * @param {Response} res - The Express response object.
	 * @param {NextFunction} next - The Express next middleware function.
	 *
	 * @throws {Error} Throws an error if the user is not found or if there's a server error.
	 *
	 * @example
	 * // GET /users?id=1
	 * // GET /users?email=user@example.com
	 * // GET /users?name=John
	 *
	 * @returns {Promise<void>} Sends a JSON response with the user data if found.
	 */
	async getUser({ query }: Request, res: Response, next: NextFunction) {
		try {
			const criteria: UserQueryParamDto = query;
			const user = await this.userService.findUser(criteria);
			this.ok(res, user);
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
	async createUser(req: Request, res: Response, next: NextFunction) {
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
	async deleteUser(req: Request, res: Response, next: NextFunction) {
		const userId = parseInt(req.params.id);

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
	async updateUser(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = parseInt(req.params.id);
			const updateData = req.body;

			await this.userService.updateUser(userId, updateData);

			this.ok(res, `User with ID ${userId} updated successfully`);
		} catch (error) {
			next(error);
		}
	}
}
