import { UserCredentials, UserLoginSchema } from '@servemate/dto';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseController } from '../../common/base.controller';
import { TypedRequest } from '../../common/route.interface';
import { Controller, Get, Post } from '../../decorators/httpDecorators';
import { Validate } from '../../middleware/validate/validate.middleware';
import { ILogger } from '../../services/logger/logger.service.interface';
import { ITokenService } from '../../services/tokens/token.service.interface';
import { UserService } from '../../services/users/user.service';
import { TYPES } from '../../types';

export const COOKIE_OPTIONS = {
	httpOnly: true,
	maxAge: 60 * 60 * 1000 * 24 * 30, // 30 days
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict' as const,
};

const ROUTES = {
	LOGIN: '/login',
	REFRESH_TOKEN: '/refresh-token',
	LOGOUT: '/logout',
	ME: '/me',
};

const ERROR_MESSAGES = {
	INVALID_CREDENTIALS: 'Invalid email or password',
	REFRESH_TOKEN_NOT_PROVIDED: 'Refresh token not provided',
	INVALID_REFRESH_TOKEN: 'Invalid refresh token',
	NOT_AUTHENTICATED: 'Пользователь не аутентифицирован',
};

@injectable()
@Controller('/auth')
export class AuthenticationController extends BaseController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.ITokenService) private tokenService: ITokenService,
		@inject(TYPES.UserService) private userService: UserService
	) {
		super(loggerService);
	}

	/**
	 * Handles user login process.
	 *
	 * This function authenticates a user based on provided credentials, generates access and refresh tokens,
	 * sets a refresh token cookie, updates the user's last login time, and returns an access token.
	 *
	 * @param req - The Express request object containing user credentials in the body.
	 * @param res - The Express response object used to send the response and set cookies.
	 * @param next - The Express next function for error handling.
	 * @returns A Promise that resolves when the login process is complete.
	 * @throws Will throw an error if authentication fails or if there's an issue during the process.
	 */

	@Validate(UserLoginSchema, 'body')
	@Post('/login')
	async login(req: TypedRequest<{}, {}, UserCredentials>, res: Response, next: NextFunction) {
		try {
			const { email, password } = req.body;

			const user = await this.userService.validateUser({ email, password });

			if (!user) {
				this.loggerService.warn(`Failed login attempt for email: ${email}`);
				return this.badRequest(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
			}

			const { accessToken, expiresIn } = await this.tokenService.generateAccessToken(user);
			const refreshToken = await this.tokenService.generateRefreshToken(user);

			this.setCookie(res, 'refreshToken', refreshToken);
			this.setCookie(res, 'accessToken', accessToken);
			this.loggerService.log(`\x1b[1mUser logged in: ${email}\x1b[0m`);
			await this.userService.updateUser(user.id, { lastLogin: new Date() });

			this.ok(res, {
				user,
				accessToken,
				expiresIn,
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Handles user logout by clearing the refresh token cookie and logging the action.
	 *
	 * @param req - The Express request object.
	 * @param res - The Express response object used to clear the cookie and send the response.
	 * @param next - The Express next function for error handling.
	 * @returns A Promise that resolves when the logout process is complete.
	 */

	@Post('/logout')
	async logout(req: TypedRequest, res: Response, next: NextFunction): Promise<void> {
		try {
			res.clearCookie('refreshToken');
			this.loggerService.log('User logged out');
			this.ok(res, { message: 'Logged out successfully' });
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Handles the token refresh process for authenticated users.
	 *
	 * This function verifies the provided refresh token, generates new access and refresh tokens,
	 * sets a new refresh token cookie, and returns a new access token to the client.
	 *
	 * @param req - The Express request object containing the refresh token in cookies.
	 * @param res - The Express response object used to send the response and set cookies.
	 * @param next - The Express next function for error handling.
	 * @returns A Promise that resolves when the token refresh process is complete.
	 * @throws Will pass any caught errors to the next middleware for handling.
	 */

	@Post('/refresh-token')
	async refreshToken(req: Request, res: Response, next: NextFunction) {
		try {
			const receivedRefreshToken = req.cookies.refreshToken?.replace(/^"|"$/g, '');

			this.loggerService.log(
				`Попытка обновить токен. Токен существует: ${Boolean(receivedRefreshToken)}`
			);

			if (!receivedRefreshToken) {
				this.loggerService.warn('Токен обновления не предоставлен');
				return this.unauthorized(res, ERROR_MESSAGES.REFRESH_TOKEN_NOT_PROVIDED);
			}

			const { accessToken, refreshToken, expiresIn } = await this.tokenService.refreshToken(
				receivedRefreshToken,
				this.userService
			);

			if (!refreshToken) {
				return this.unauthorized(res, ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
			}

			this.setCookie(res, 'refreshToken', refreshToken);
			this.ok(res, {
				accessToken,
				expiresIn,
			});
		} catch (error) {
			this.loggerService.error(
				`unexpected error in refreshToken: ${error instanceof Error ? error.message : String(error)}`
			);
			next(error);
		}
	}

	/**
	 * Sets a cookie on the response object with predefined options.
	 *
	 * @param res - The Express response object on which to set the cookie.
	 * @param name - The name of the cookie to be set.
	 * @param value - The value to be stored in the cookie.
	 * @private
	 */
	private setCookie(res: Response, name: string, value: string) {
		this.cookie(res, name, value, COOKIE_OPTIONS);
	}

	/**
	 * Handles the retrieval of the current authenticated user's data.
	 *
	 * This function checks if the user is authenticated, retrieves the user's data from the database,
	 * and returns the user data in the response.
	 *
	 * @param req - The Express request object.
	 * @param res - The Express response object used to send the response.
	 * @param next - The Express next function for error handling.
	 * @returns A Promise that resolves when the user data retrieval process is complete.
	 * @throws Will pass any caught errors to the next middleware for handling.
	 */

	@Get('/me')
	async me(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user?.id;
			this.loggerService.log(`Получение данных пользователя с ID: ${userId}`);
			if (!userId) {
				this.loggerService.warn('Пользователь не аутентифицирован');
				return this.unauthorized(res, ERROR_MESSAGES.NOT_AUTHENTICATED);
			}

			const user = await this.userService.findUserById(userId);
			console.log(user);
			if (!user) {
				this.loggerService.warn(`Пользователь с ID ${userId} не найден`);
				return this.unauthorized(res, ERROR_MESSAGES.NOT_AUTHENTICATED);
			}

			this.ok(res, { user });
		} catch (error) {
			this.loggerService.error(
				`unexpected error in me: ${error instanceof Error ? error.message : String(error)}`
			);
			next(error);
		}
	}
}
