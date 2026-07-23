import { NextFunction, Request, Response } from 'express';
import { BaseController } from '../common/base.controller';

/**
 * Interface for the User Controller, extending the BaseController.
 * Defines methods for handling user-related operations.
 */
export interface IUsersController extends BaseController {
  /**
   * Retrieves all users.
   * @param req - The Express Request object.
   * @param res - The Express Response object.
   * @param next - The Express NextFunction for error handling.
   * @returns A Promise that resolves when the operation is complete.
   */
  findAll(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Retrieves a specific user by their identifier.
   * @param req - The Express Request object, expected to contain the user ID.
   * @param res - The Express Response object.
   * @param next - The Express NextFunction for error handling.
   * @returns A Promise that resolves when the operation is complete.
   */
  findOne(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Creates a new user in the system.
   * @param req - The Express Request object, containing the new user's data.
   * @param res - The Express Response object.
   * @param next - The Express NextFunction for error handling.
   * @returns A Promise that resolves when the operation is complete.
   */
  create(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Deletes a user from the system.
   * @param req - The Express Request object, expected to contain the user ID to delete.
   * @param res - The Express Response object.
   * @param next - The Express NextFunction for error handling.
   * @returns A Promise that resolves when the operation is complete.
   */
  delete(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Updates an existing user's information.
   * @param req - The Express Request object, containing the updated user data and user ID.
   * @param res - The Express Response object.
   * @param next - The Express NextFunction for error handling.
   * @returns A Promise that resolves when the operation is complete.
   */
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
}
