import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { IMiddleware } from '../common/middleware.interface';
import { TYPES } from '../types';
import { ITokenService } from './token.service.interface';

@injectable()
export class AuthMiddleware implements IMiddleware {
  constructor(
    @inject(TYPES.ITokenService) private tokenService: ITokenService
  ) {}

  execute(req: Request, res: Response, next: NextFunction): void {
    this.tokenService.authenticate(req, res, next);
  }
}
