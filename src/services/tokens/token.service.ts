import { NextFunction, Request, Response } from 'express';
import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../../../env';
import { HTTPError } from '../../errors/http-error.class';
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

	constructor() {
		this.tokenCache = new NodeCache({ stdTTL: ENV.TOKEN_CACHE_TTL }); // Cache expire time.
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
			const decoded = await this.verifyToken(token, ENV.JWT_SECRET);

			(req as any).user = decoded;
			next();
		} catch (error) {
			this.handleAuthError(error, next);
		}
	}

	async generateAccessToken(user: DecodedUser): Promise<IAccessToken> {
		const accessToken = await this.generateToken(user, false);
		const expiresIn = this.parseExpiresIn(ENV.JWT_EXPIRES_IN);
		this.tokenCache.set(accessToken, user);
		return {
			accessToken,
			expiresIn,
		};
	}

	async generateRefreshToken(user: DecodedUser): Promise<string> {
		return this.generateToken(user, true);
	}

	async refreshToken(refreshToken: string, userService: IUserService): Promise<IRefreshToken> {
		try {
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
		const expiresIn = isRefreshToken ? ENV.JWT_REFRESH_EXPIRES_IN : ENV.JWT_EXPIRES_IN;

		return new Promise((resolve, reject) => {
			jwt.sign(payload, secret, { expiresIn }, (err, token) => {
				if (err) reject(err);
				else resolve(token as string);
			});
		});
	}

	private async verifyToken(
		token: string,
		secret: string,
		isRefreshToken = false
	): Promise<DecodedUser> {
		// Check if the token is a refresh token if isRefreshToken is false to check if it is in the cache.
		if (!isRefreshToken) {
			console.log('Verifying access token');
			const cachedUser = this.tokenCache.get<DecodedUser>(token);
			if (cachedUser) {
				return cachedUser;
			}
			const decodedToken = jwt.decode(token) as { exp?: number };
			if (decodedToken?.exp && decodedToken.exp < Math.floor(Date.now() / 1000)) {
				this.tokenCache.del(token);
				throw new jwt.TokenExpiredError('jwt expired', new Date(decodedToken.exp * 1000));
			}
		}

		// Verify the token using the appropriate secret.
		return new Promise((resolve, reject) => {
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
	}

	private parseExpiresIn(expiresIn: string | number): number {
		if (typeof expiresIn === 'number') {
			return expiresIn;
		}

		const match = expiresIn.match(/(\d+)([smhd])/);

		if (!match) {
			const seconds = Number(expiresIn);

			return isNaN(seconds) ? 900 : seconds;
		}

		const value = parseInt(match[1], 10);
		const unit = match[2];

		switch (unit) {
			case 's':
				return value;
			case 'm':
				return value * 60;
			case 'h':
				return value * 3600;
			case 'd':
				return value * 86400;
			default:
				throw new Error(`Invalid time unit: ${unit}`);
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
