import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ENV } from '../../../env';
import { BaseController } from '../../common/base.controller';
import { UserCredentials, UserLoginSchema } from '../../dto/user.dto';
import { ValidateMiddleware } from '../../middleware/validate/validate.middleware';
import { ILogger } from '../../services/logger/logger.service.interface';
import { ITokenService } from '../../services/tokens/token.service.interface';
import { UserService } from '../../services/users/user.service';
import { TYPES } from '../../types';

const COOKIE_OPTIONS = {
	httpOnly: true,
	maxAge: 60 * 60 * 1000 * 24 * 30, // 30 days
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict' as const,
};

const ROUTES = {
	LOGIN: '/login',
	REFRESH_TOKEN: '/refresh-token',
	LOGOUT: '/logout',
};

const ERROR_MESSAGES = {
	INVALID_CREDENTIALS: 'Invalid email or password',
	REFRESH_TOKEN_NOT_PROVIDED: 'Refresh token not provided',
	INVALID_REFRESH_TOKEN: 'Invalid refresh token',
};

@injectable()
export class AuthenticationController extends BaseController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.ITokenService) private tokenService: ITokenService,
		@inject(TYPES.UserService) private userService: UserService
	) {
		super(loggerService);
		// this.loggerService.setContext('AuthenticationController');
		// this.loggerService.log('AuthenticationController');
		this.bindRoutes([
			{
				method: 'post',
				path: '/login',
				func: this.login,
				middlewares: [new ValidateMiddleware(UserLoginSchema)],
			},
			{
				method: 'post',
				path: '/refresh-token',
				func: this.refreshToken,
				middlewares: [],
			},
			{
				method: 'post',
				path: '/logout',
				func: () => {},
				middlewares: [],
			},
		]);
	}

	async login(req: Request<{}, {}, UserCredentials>, res: Response, next: NextFunction) {
		try {
			const { email, password } = req.body;

			const user = await this.userService.validateUser({ email, password });

			if (!user) {
				this.loggerService.warn(`Failed login attempt for email: ${email}`);
				this.badRequest(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
			}

			const accessToken = await this.tokenService.generateToken(user, false);
			const refreshToken = await this.tokenService.generateToken(user, true);
			console.log(refreshToken);

			this.setCookie(res, 'refreshToken', refreshToken);
			this.loggerService.log(`\x1b[1mUser logged in: ${email}\x1b[0m`);
			this.userService.updateUser(user.id, { lastLogin: new Date() });
			this.ok(res, { accessToken });
		} catch (error) {
			next(error);
		}
	}

	async logout(req: Request, res: Response, next: NextFunction) {
		try {
			res.clearCookie('refreshToken');
			this.loggerService.log('User logged out');
			this.ok(res, { message: 'Logged out successfully' });
		} catch (error) {
			next(error);
		}
	}

	async refreshToken(req: Request, res: Response, next: NextFunction) {
		console.log(req.cookies?.refreshToken.replace(/^"|"$/g, ''));

		try {
			const refreshToken = req.cookies.refreshToken?.replace(/^"|"$/g, '');

			if (!refreshToken) {
				return this.unauthorized(res, 'Refresh token not provided');
			}

			const decodedUser = await this.tokenService.verifyToken(refreshToken, ENV.JWT_REFRESH);

			if (!decodedUser) {
				return this.unauthorized(res, 'Invalid refresh token');
			}

			const newAccessToken = this.tokenService.generateToken(decodedUser, false);
			const newRefreshToken = this.tokenService.generateToken(decodedUser, true);

			this.cookie(res, 'refreshToken', newRefreshToken, {
				httpOnly: true,
				maxAge: 60 * 60 * 1000 * 24 * 30, // 30 days
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
			});

			this.ok(res, { accessToken: newAccessToken });
		} catch (error) {
			next(error);
		}
	}

	private setCookie(res: Response, name: string, value: string) {
		this.cookie(res, name, value, COOKIE_OPTIONS);
	}
}
