import { UserDto } from '../щдввещ';
import { AccessToken } from './entities/access-token.vo';
import { RefreshToken } from './entities/refresh-token.vo';

export type DecodedUser = Pick<UserDto, 'email' | 'role' | 'id'>;

export interface ITokenService {
  verifyAccessToken(token: string): Promise<DecodedUser>;
  verifyRefreshToken(token: string): Promise<{ userId: number; jti: string }>;
  generateAccessToken(user: DecodedUser): Promise<AccessToken>;
  generateRefreshToken(user: DecodedUser): Promise<RefreshToken>;
  revokeAccessToken(token: string): void;
}
