import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { IMiddleware } from '../common/middleware.interface';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import { ITokenService } from './token.service.interface';

@injectable()
export class AuthMiddleware implements IMiddleware {
  constructor(
    @inject(TYPES.ITokenService) private tokenService: ITokenService
  ) {}

  async execute(
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    const header = req.headers.authorization;

    if (!header) {
      return next(new HTTPError(401, 'Header', 'Authorization header missing'));
    }

    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(
        new HTTPError(401, 'Header', 'Invalid Authorization header format')
      );
    }

    try {
      req.user = await this.tokenService.verifyAccessToken(token);
      return next();
    } catch (error) {
      return next(new HTTPError(401, 'Token', 'Invalid token'));
    }
  }
}
