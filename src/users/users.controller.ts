import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseController } from '../common/base.controller';
import { TypedRequest } from '../common/route.interface';
import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
} from '../decorators/httpDecorators';
import { Roles } from '../decorators/Roles';
import { Validate } from '../middleware/validate/validate.middleware';
import { ILogger } from '../services/logger/logger.service.interface';
import { TYPES } from '../types';
import {
  CreateUserDto,
  CreateUserSchema,
  UpdateUserDto,
  UpdateUserSchema,
  UserListResponse,
  UserParamsDto,
  UserParamsSchema,
  UserQueryDto,
  UserQuerySchema,
  UserSortColumn,
} from './dto';
import { IUsersController } from './users.controller.interface';
import { IUsersService } from './users.service.interface';

export type UserControllerService = Pick<
  IUsersService,
  | 'findUsers'
  | 'findUserById'
  | 'createUser'
  | 'deleteUser'
  | 'updateUser'
  | 'validateCredentials'
>;

@injectable()
@Controller('/users')
export class UserController extends BaseController implements IUsersController {
  constructor(
    @inject(TYPES.ILogger) private loggerService: ILogger,
    @inject(TYPES.UsersService) private userService: UserControllerService
  ) {
    super(loggerService);
  }

  @Validate(UserQuerySchema, 'query')
  @Roles([UserRole.ADMIN, UserRole.MANAGER])
  @Get('/')
  async findAll(
    req: TypedRequest<{}, UserQueryDto, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const query = this.getValidated(req, 'query');
    try {
      const result: UserListResponse = await this.userService.findUsers(query);
      this.ok(res, result);
    } catch (error) {
      next(error);
    }
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

  @Validate(UserParamsSchema, 'params')
  @Roles([UserRole.ADMIN, UserRole.MANAGER])
  @Get('/:id')
  async findOne(
    req: TypedRequest<UserParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const userId = this.getValidated(req, 'params').id;
    try {
      const user = await this.userService.findUserById(userId);
      if (!user) {
        this.notFound(res, 'User not found');
        return;
      }
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
  @Validate(CreateUserSchema, 'body')
  @Post('/')
  @Roles([UserRole.ADMIN, UserRole.MANAGER])
  async create(
    req: TypedRequest<{}, {}, CreateUserDto>,
    res: Response,
    next: NextFunction
  ) {
    const user = this.getValidated(req, 'body');
    try {
      const newUser = await this.userService.createUser(user);

      const message = `User ${newUser.name.toUpperCase()} ${newUser.email.toLowerCase()} created successfully`;

      this.loggerService.log(message);
      this.ok(res, newUser);
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
  @Validate(UserParamsSchema, 'params')
  @Delete('/:id')
  @Roles([UserRole.ADMIN, UserRole.MANAGER])
  async delete(
    req: TypedRequest<UserParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ) {
    const user = this.getValidated(req, 'params').id;
    try {
      await this.userService.deleteUser(user);
      this.ok(res, { message: `User with ID ${user} deleted successfully` });
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
  @Roles([UserRole.ADMIN, UserRole.MANAGER])
  @Validate(UpdateUserSchema, 'body')
  @Validate(UserParamsSchema, 'params')
  @Put('/:id')
  async update(
    req: TypedRequest<UserParamsDto, {}, UpdateUserDto>,
    res: Response,
    next: NextFunction
  ) {
    const user = this.getValidated(req, 'params').id;
    const payload = this.getValidated(req, 'body');
    try {
      await this.userService.updateUser(user, payload);

      this.ok(res, { message: `User with ID ${user} updated successfully` });
    } catch (error) {
      next(error);
    }
  }
}
