import { NextFunction, Request, Response } from 'express';
import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../../../env';
import { HTTPError } from '../../errors/http-error.class';
import { parseExpiresIn } from '../../utils/expireEncoder';
import { IUserService } from '../users/user.service.interface';
import {
	AccessTokenPayload,
	DecodedUser,
	IAccessToken,
	IRefreshToken,
	ITokenService,
	RefreshTokenPayload,
} from './token.service.interface';

@injectable()
export class TokenService implements ITokenService {
	private tokenCache: NodeCache;
	private revokedTokens: NodeCache;

	constructor() {
		const ttlSeconds = Math.max(1, Math.floor(ENV.TOKEN_CACHE_TTL / 1000));
		this.tokenCache = new NodeCache({ stdTTL: ttlSeconds });
		this.revokedTokens = new NodeCache({ stdTTL: ttlSeconds });
	}

	async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
		const authHeader = req.headers.authorization;
		if (!authHeader) {
			return next(new HTTPError(401, 'Header', 'No authorization header provided'));
		}

		const [bearer, token] = authHeader.split(' ');

		if (bearer !== 'Bearer' || !token) {
			return next(new HTTPError(401, 'Token', 'Invalid authorization format'));
		}

		try {
			if (this.isTokenRevoked(token)) {
				return next(new HTTPError(401, 'Token', 'Token has been revoked'));
			}

			const decoded = await this.verifyToken(token, ENV.JWT_SECRET);
			(req as any).user = decoded;
			next();
		} catch (error) {
			if (error instanceof HTTPError) {
				return next(error);
			}
			this.handleAuthError(error, next);
		}
	}

	async generateAccessToken(user: DecodedUser): Promise<IAccessToken> {
		const accessToken = await this.generateToken(user, false);
		const expiresIn = parseExpiresIn(ENV.JWT_EXPIRES_IN);
		this.tokenCache.set(accessToken, user);

		return {
			accessToken,
			expiresIn,
		};
	}

	async generateRefreshToken(user: DecodedUser): Promise<string> {
		return this.generateToken(user, true);
	}

	revokeToken(token: string): void {
		this.revokedTokens.set(token, true, this.getTokenTtlSeconds(token));
		this.tokenCache.del(token);
	}

	async refreshToken(refreshToken: string, userService: IUserService): Promise<IRefreshToken> {
		try {
			if (this.isTokenRevoked(refreshToken)) {
				throw new HTTPError(401, 'Token', 'Invalid refresh token');
			}

			const decoded = (await this.verifyToken(refreshToken, ENV.JWT_REFRESH, true)) as DecodedUser;

			const currentUser = await userService.findUserById(decoded.id);
			if (!currentUser) {
				throw new HTTPError(401, 'Token', 'User not found');
			}

			const user = { id: currentUser.id, email: currentUser.email, role: currentUser.role };
			const { accessToken, expiresIn } = await this.generateAccessToken(user);
			const newRefreshToken = await this.generateRefreshToken(user);

			return { accessToken, expiresIn, refreshToken: newRefreshToken };
		} catch (error) {
			if (error instanceof HTTPError) {
				throw error;
			}
			throw new HTTPError(401, 'Token', 'Invalid refresh token');
		}
	}

	private async generateToken(user: DecodedUser, isRefreshToken: boolean = false): Promise<string> {
		const basePayload = {
			id: user.id,
			jti: uuidv4(),
			iat: Math.floor(Date.now() / 1000),
		};

		let payload: AccessTokenPayload | RefreshTokenPayload;

		if (!isRefreshToken) {
			payload = {
				...basePayload,
				email: user.email,
				role: user.role,
			};
		} else {
			payload = basePayload;
		}

		const secret = isRefreshToken ? ENV.JWT_REFRESH : ENV.JWT_SECRET;
		const expiresIn = isRefreshToken
			? parseExpiresIn(ENV.JWT_REFRESH_EXPIRES_IN, false)
			: parseExpiresIn(ENV.JWT_EXPIRES_IN, false);

		return new Promise((resolve, reject) => {
			jwt.sign(payload, secret, { expiresIn, algorithm: 'HS256' }, (err, token) => {
				if (err) reject(err);
				else resolve(token as string);
			});
		});
	}

	private isTokenRevoked(token: string): boolean {
		return Boolean(this.revokedTokens.get(token));
	}

	private getTokenTtlSeconds(token: string, isRefreshToken = false): number {
		const decodedToken = jwt.decode(token) as { exp?: number } | null;
		if (decodedToken?.exp) {
			const ttlMs = decodedToken.exp * 1000 - Date.now();
			return Math.max(1, Math.ceil(ttlMs / 1000));
		}

		const fallbackExpiresIn = isRefreshToken ? ENV.JWT_REFRESH_EXPIRES_IN : ENV.JWT_EXPIRES_IN;
		return Math.max(1, Math.ceil(parseExpiresIn(fallbackExpiresIn, true) / 1000));
	}

	private async verifyToken(
		token: string,
		secret: string,
		isRefreshToken = false
	): Promise<DecodedUser> {
		try {
			if (!isRefreshToken) {
				const cachedUser = this.tokenCache.get<DecodedUser>(token);
				if (cachedUser) {
					return cachedUser;
				}

				const decodedToken = jwt.decode(token) as { exp?: number } | null;
				if (decodedToken?.exp && decodedToken.exp * 1000 < Date.now()) {
					this.tokenCache.del(token);
					throw new jwt.TokenExpiredError('jwt expired', new Date(decodedToken.exp * 1000));
				}
			}

			const validatedToken = await new Promise((resolve, reject): void => {
				jwt.verify(token, secret, (err, decoded) => {
					if (err) {
						reject(err);
					} else {
						if (!isRefreshToken) {
							this.tokenCache.set(token, decoded as DecodedUser);
						}
						resolve(decoded as DecodedUser);
					}
				});
			});

			return validatedToken as DecodedUser;
		} catch (error: any) {
			throw error;
		}
	}

	private handleAuthError(error: any, next: NextFunction): void {
		if (error instanceof jwt.TokenExpiredError) {
			return next(new HTTPError(401, 'Token', 'Token has expired'));
		}
		if (error instanceof jwt.JsonWebTokenError) {
			return next(new HTTPError(401, 'Token', 'Invalid token'));
		}
		return next(new HTTPError(401, 'Authentication', 'An error occurred during authentication'));
	}
}