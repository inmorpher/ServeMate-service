import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { IMiddleware } from '../../common/middleware.interface';
import { ITokenService } from '../../services/tokens/token.service.interface';
import { TYPES } from '../../types';

export type DecodedUser = Pick<User, 'email' | 'role' | 'id'>;

@injectable()
export class AuthMiddleware implements IMiddleware {
	constructor(@inject(TYPES.ITokenService) private tokenService: ITokenService) {}

	execute(req: Request, res: Response, next: NextFunction): void {
		this.tokenService.authenticate(req, res, next);
	}
}
