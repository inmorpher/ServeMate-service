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
	ITokenService,
	RefreshTokenPayload,
} from './token.service.interface';

@injectable()
export class TokenService implements ITokenService {
	private tokenCache: NodeCache;

	constructor() {
		this.tokenCache = new NodeCache({ stdTTL: ENV.TOKEN_CACHE_TTL }); // Cache for 1 hour
	}

	async generateToken(user: DecodedUser, isRefreshToken: boolean = false): Promise<string> {
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

	async verifyToken(token: string, secret: string): Promise<DecodedUser> {
		const cachedUser = this.tokenCache.get<DecodedUser>(token);
		if (cachedUser) {
			return cachedUser;
		}

		return new Promise((resolve, reject) => {
			jwt.verify(token, secret, (err, decoded) => {
				if (err) {
					reject(err);
				} else {
					this.tokenCache.set(token, decoded as DecodedUser);
					resolve(decoded as DecodedUser);
				}
			});
		});
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

	private handleAuthError(error: any, next: NextFunction): void {
		if (error instanceof jwt.TokenExpiredError) {
			return next(new HTTPError(401, 'Token', 'Token has expired'));
		}
		if (error instanceof jwt.JsonWebTokenError) {
			return next(new HTTPError(401, 'Token', 'Invalid token'));
		}
		return next(new HTTPError(500, 'Authentication', 'An error occurred during authentication'));
	}

	async refreshToken(
		refreshToken: string,
		userService: IUserService
	): Promise<{ accessToken: string; refreshToken: string } | null> {
		try {
			const decoded = (await this.verifyToken(refreshToken, ENV.JWT_REFRESH)) as DecodedUser;

			const currentUser = await userService.findUserById(decoded.id);
			if (!currentUser) {
				return null;
			}

			const user = { id: currentUser.id, email: currentUser.email, role: currentUser.role };

			const newAccessToken = await this.generateToken(user, false);
			const newRefreshToken = await this.generateToken(user, true);

			this.tokenCache.del(refreshToken);

			return { accessToken: newAccessToken, refreshToken: newRefreshToken };
		} catch (error) {
			return null;
		}
	}
}
