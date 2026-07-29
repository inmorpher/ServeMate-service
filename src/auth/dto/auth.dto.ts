import { AuthenticatedUser } from '../../users/dto';

export interface SessionMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface LoginResult {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
