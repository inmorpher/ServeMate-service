import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { ENV } from '../../env';
import { BaseController } from '../common/base.controller';
import { TypedRequest } from '../common/route.interface';
import { Controller, Get, Post } from '../decorators/httpDecorators';
import { ILogger } from '../logger/logger.service.interface';
import { Validate } from '../middleware/validate/validate.middleware';
import { TYPES } from '../types';
import { UserLoginDto, UserLoginSchema } from '../users/dto';
import { IAuthService } from './auth.service.interface';
import { RefreshTokenRequest } from './dto/auth.dto';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.PRODUCTION,
  sameSite: ENV.PRODUCTION ? ('strict' as const) : ('lax' as const),
  path: '/api/auth',
};

const ERROR_MESSAGES = {
  REFRESH_TOKEN_NOT_PROVIDED: 'Refresh token not provided',
  NOT_AUTHENTICATED: 'User is not authenticated',
};

@injectable()
@Controller('/auth')
export class AuthenticationController extends BaseController {
  constructor(
    @inject(TYPES.ILogger) private loggerService: ILogger,
    @inject(TYPES.AuthService) private authService: IAuthService
  ) {
    super(loggerService);
  }

  @Validate(UserLoginSchema, 'body')
  @Post('/login')
  async login(
    req: TypedRequest<{}, {}, UserLoginDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validated = this.getValidated(req, 'body');

      const result = await this.authService.login(validated, {
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });

      this.setRefreshCookie(res, result.refreshToken);
      this.ok(res, result);
    } catch (error) {
      next(error);
    }
  }

  @Post('/logout')
  async logout(req: TypedRequest, res: Response, next: NextFunction) {
    try {
      const authorizationHeader = req.headers['authorization'];
      const accessToken = authorizationHeader?.startsWith('Bearer ')
        ? authorizationHeader.slice('Bearer '.length)
        : undefined;

      const refreshToken = this.getRefreshToken(req);

      await this.authService.logout(accessToken, refreshToken);
      res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
      this.loggerService.log('User logged out successfully');
      this.ok(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  @Post('/refresh-token')
  async refreshToken(
    req: TypedRequest<{}, {}, RefreshTokenRequest>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const cookieToken = req.cookies?.refreshToken;
      const bodyToken = req.body?.refreshToken;

      if (cookieToken && bodyToken) {
        return this.badRequest(
          res,
          'Provide refresh token in cookie or body, not both'
        );
      }

      const refreshToken = cookieToken ?? bodyToken;

      if (!refreshToken) {
        return this.unauthorized(
          res,
          ERROR_MESSAGES.REFRESH_TOKEN_NOT_PROVIDED
        );
      }

      const result = await this.authService.refresh(refreshToken, {
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      this.setRefreshCookie(res, result.refreshToken);
      this.ok(res, result);
    } catch (error) {
      this.loggerService.error(
        'Error refreshing token: ' + (error as Error).message
      );
      next(error);
    }
  }

  @Get('/me')
  async me(req: TypedRequest<{}, {}, {}>, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return this.unauthorized(res, ERROR_MESSAGES.NOT_AUTHENTICATED);
      }

      const user = await this.authService.me(userId);
      this.ok(res, { user });
    } catch (error) {
      this.loggerService.error(
        `Unexpected error in me: ${error instanceof Error ? error.message : String(error)}`
      );
      next(error);
    }
  }

  private getRefreshToken(req: TypedRequest): string | undefined {
    const cookieToken = req.cookies?.refreshToken;
    const bodyToken = (req.body as RefreshTokenRequest | undefined)
      ?.refreshToken;

    return cookieToken ?? bodyToken;
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  }
}
