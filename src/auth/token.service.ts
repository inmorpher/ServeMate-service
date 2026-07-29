import { NextFunction, Request, Response } from 'express';
import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../../env';
import { HTTPError } from '../errors/http-error.class';
import { parseExpiresIn } from '../utils/expireEncoder';
import { AccessToken } from './entities/access-token.vo';
import { RefreshToken } from './entities/refresh-token.vo';
import { DecodedUser, ITokenService } from './token.service.interface';

@injectable()
export class TokenService implements ITokenService {
  private tokenCache: NodeCache;
  private revokedTokens: NodeCache;

  constructor() {
    const ttlSeconds = Math.max(
      1,
      Math.floor(Number(process.env.TOKEN_CACHE_TTL) / 1000)
    );
    this.tokenCache = new NodeCache({ stdTTL: ttlSeconds });
    this.revokedTokens = new NodeCache({ stdTTL: ttlSeconds });
  }
  async authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(new HTTPError(401, 'Header', 'Authorization header missing'));
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      return next(
        new HTTPError(401, 'Header', 'Invalid Authorization header format')
      );
    }

    try {
      if (this.isTokenRevoked(token)) {
        return next(new HTTPError(401, 'Token', 'Token has been revoked'));
      }

      const decoded = await this.verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof HTTPError) {
        return next(error);
      }
      this.handleAuthError(error, next);
    }
  }
  async verifyRefreshToken(
    token: string
  ): Promise<{ userId: number; jti: string }> {
    const decoded = (await this.verifyToken(token, ENV.JWT_REFRESH)) as any;
    return { userId: decoded.id, jti: decoded.jti };
  }
  async generateAccessToken(user: DecodedUser): Promise<AccessToken> {
    const { token, expiresAt } = await this.generateToken(user, false);
    const expiresIn = parseExpiresIn(ENV.JWT_EXPIRES_IN);
    return new AccessToken(token, expiresIn, expiresAt);
  }
  async generateRefreshToken(user: DecodedUser): Promise<RefreshToken> {
    const { token, jti, expiresAt } = await this.generateToken(user, true);
    return new RefreshToken(token, jti, expiresAt);
  }
  revokeAccessToken(token: string): void {
    this.revokedTokens.set(token, true, this.getTokenTtlSeconds(token));

    this.tokenCache.del(token);
  }

  private async verifyAccessToken(token: string): Promise<DecodedUser> {
    const cached = this.tokenCache.get<DecodedUser>(token);
    if (cached) {
      return cached;
    }
    const decoded = jwt.decode(token) as { exp?: number } | null;

    if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
      throw new jwt.TokenExpiredError(
        'Token has expired',
        new Date(decoded.exp * 1000)
      );
    }

    return new Promise((resolve, reject) => {
      jwt.verify(token, ENV.JWT_SECRET, (err, decoded) => {
        if (err) {
          return reject(err);
        } else {
          this.tokenCache.set(token, decoded as DecodedUser);
          resolve(decoded as DecodedUser);
        }
      });
    });
  }

  private async generateToken(
    user: DecodedUser,
    isRefreshToken: boolean
  ): Promise<{ token: string; jti: string; expiresAt: Date }> {
    const jti = uuidv4();

    const basePayload = {
      id: user.id,
      jti,
      iat: Math.floor(Date.now() / 1000),
    };

    const payload = isRefreshToken
      ? basePayload
      : { ...basePayload, email: user.email, role: user.role };

    const secret = isRefreshToken ? ENV.JWT_REFRESH : ENV.JWT_SECRET;

    const expiresInSeconds = isRefreshToken
      ? parseExpiresIn(ENV.JWT_REFRESH_EXPIRES_IN)
      : parseExpiresIn(ENV.JWT_EXPIRES_IN);

    const token = await new Promise<string>((resolve, reject) => {
      jwt.sign(
        payload,
        secret,
        { expiresIn: expiresInSeconds, algorithm: 'HS256' },
        (err, t) => {
          if (err) reject(err);
          else resolve(t as string);
        }
      );
    });

    return {
      token,
      jti,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  private async verifyToken(
    token: string,
    secret: string
  ): Promise<DecodedUser> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded as DecodedUser);
        }
      });
    });
  }

  private isTokenRevoked(token: string): boolean {
    return Boolean(this.revokedTokens.get(token));
  }

  private getTokenTtlSeconds(token: string): number {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (decoded?.exp) {
      return Math.max(1, Math.ceil(decoded.exp * 1000 - Date.now()) / 1000);
    }

    return Math.max(
      1,
      Math.ceil(parseExpiresIn(ENV.TOKEN_CACHE_TTL, true) / 1000)
    );
  }

  private handleAuthError(error: unknown, next: NextFunction): void {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new HTTPError(401, 'Token', 'Token has expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new HTTPError(401, 'Token', 'Invalid token'));
    }
    return next(
      new HTTPError(
        401,
        'Authentication',
        'An error occurred during authentication'
      )
    );
  }
}
