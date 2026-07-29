import { NextFunction, Request, Response } from 'express';
import { UserDto } from '../dto-package';
import { AccessToken } from './entities/access-token.vo';
import { RefreshToken } from './entities/refresh-token.vo';

export type DecodedUser = Pick<UserDto, 'email' | 'role' | 'id'>;

export interface ITokenService {
  authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
  verifyRefreshToken(token: string): Promise<{ userId: number; jti: string }>;
  generateAccessToken(user: DecodedUser): Promise<AccessToken>;
  generateRefreshToken(user: DecodedUser): Promise<RefreshToken>;
  revokeAccessToken(token: string): void;
}
