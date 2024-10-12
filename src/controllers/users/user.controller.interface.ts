import { NextFunction, Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';

/**
 * Interface for the User Controller, extending the BaseController.
 * Defines methods for handling user-related operations.
 */
export interface IUserController extends BaseController {
	/**
	 * Retrieves all users from the system.
	 * @param req - The Express Request object.
	 * @param res - The Express Response object.
	 * @param next - The Express NextFunction for error handling.
	 * @returns A Promise that resolves when the operation is complete.
	 */
	getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void>;

	/**
	 * Retrieves a specific user by their identifier.
	 * @param req - The Express Request object, expected to contain the user ID.
	 * @param res - The Express Response object.
	 * @param next - The Express NextFunction for error handling.
	 * @returns A Promise that resolves when the operation is complete.
	 */
	getUser(req: Request, res: Response, next: NextFunction): Promise<void>;

	/**
	 * Creates a new user in the system.
	 * @param req - The Express Request object, containing the new user's data.
	 * @param res - The Express Response object.
	 * @param next - The Express NextFunction for error handling.
	 * @returns A Promise that resolves when the operation is complete.
	 */
	createUser(req: Request, res: Response, next: NextFunction): Promise<void>;

	/**
	 * Deletes a user from the system.
	 * @param req - The Express Request object, expected to contain the user ID to delete.
	 * @param res - The Express Response object.
	 * @param next - The Express NextFunction for error handling.
	 * @returns A Promise that resolves when the operation is complete.
	 */
	deleteUser(req: Request, res: Response, next: NextFunction): Promise<void>;

	/**
	 * Updates an existing user's information.
	 * @param req - The Express Request object, containing the updated user data and user ID.
	 * @param res - The Express Response object.
	 * @param next - The Express NextFunction for error handling.
	 * @returns A Promise that resolves when the operation is complete.
	 */
	updateUser(req: Request, res: Response, next: NextFunction): Promise<void>;
}
