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

	constructor() {
		this.tokenCache = new NodeCache({ stdTTL: ENV.TOKEN_CACHE_TTL }); // Cache expire time.
	}

	async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
		console.log('Authenticating user...');
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
		const expiresIn = parseExpiresIn(ENV.JWT_EXPIRES_IN);
		this.tokenCache.set(accessToken, user);
		console.log('expiresIn', expiresIn);
		return {
			accessToken,
			expiresIn,
		};
	}

	async generateRefreshToken(user: DecodedUser): Promise<string> {
		return this.generateToken(user, true);
	}

	async refreshToken(refreshToken: string, userService: IUserService): Promise<IRefreshToken> {
		console.log('Refreshing token...');
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

		const parsedRefreshTokenExpiresIn = parseExpiresIn(ENV.JWT_REFRESH_EXPIRES_IN, true);
		const parsedAccessTokenExpiresIn = parseExpiresIn(ENV.JWT_EXPIRES_IN, true);

		const now = Date.now();

		const refreshExpiresAt = parsedRefreshTokenExpiresIn + now;
		const accessExpiresAt = parsedAccessTokenExpiresIn + now;

		// Преобразуем метки времени в удобочитаемый формат
		const nowDate = new Date(now);
		const accessExpiresDate = new Date(accessExpiresAt);
		const refreshExpiresDate = new Date(refreshExpiresAt);

		// Создаем более информативный вывод времен с разницей
		const accessDiffMinutes = Math.round((accessExpiresAt - now) / 60000);
		const refreshDiffMinutes = Math.round((refreshExpiresAt - now) / 60000);

		console.log(`Текущее время: ${nowDate.toLocaleString()}`);
		console.log(
			`Access токен истекает: ${accessExpiresDate.toLocaleString()} (через ${accessDiffMinutes} мин)`
		);
		console.log(
			`Refresh токен истекает: ${refreshExpiresDate.toLocaleString()} (через ${refreshDiffMinutes} мин)`
		);

		const secret = isRefreshToken ? ENV.JWT_REFRESH : ENV.JWT_SECRET;
		const expiresIn = isRefreshToken ? parsedRefreshTokenExpiresIn : parsedAccessTokenExpiresIn;
		return new Promise((resolve, reject) => {
			jwt.sign(payload, secret, { expiresIn, algorithm: 'HS256' }, (err, token) => {
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
		const startTime = performance.now();
		let cacheTime = 0;
		let decodeTime = 0;
		let verifyTime = 0;

		try {
			// Проверка кэша
			if (!isRefreshToken) {
				const cacheStartTime = performance.now();
				const cachedUser = this.tokenCache.get<DecodedUser>(token);
				cacheTime = performance.now() - cacheStartTime;

				if (cachedUser) {
					const totalTime = performance.now() - startTime;
					console.log(
						`Token verification (cached): ${totalTime.toFixed(2)}ms (cache lookup: ${cacheTime.toFixed(2)}ms)`
					);
					return cachedUser;
				}

				// Проверка expiration

				const decodedToken = jwt.decode(token) as { exp?: number };

				if (decodedToken?.exp && decodedToken.exp * 1000 < Date.now()) {
					this.tokenCache.del(token);
					throw new jwt.TokenExpiredError('jwt expired', new Date(decodedToken.exp * 1000));
				}

				console.log('Decoded token:', (decodedToken.exp as number) * 1000);
				console.log('Current time:', Date.now());
			}

			// JWT верификация
			const verifyStartTime = performance.now();
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
			verifyTime = performance.now() - verifyStartTime;

			// Измерение общего времени выполнения
			const totalTime = performance.now() - startTime;
			console.log(
				`Token verification: ${totalTime.toFixed(2)}ms (cache: ${cacheTime.toFixed(2)}ms, decode: ${decodeTime.toFixed(2)}ms, verify: ${verifyTime.toFixed(2)}ms)`
			);

			return validatedToken as DecodedUser;
		} catch (error: any) {
			const totalTime = performance.now() - startTime;
			console.log(`Token verification failed: ${totalTime.toFixed(2)}ms, error: ${error?.message}`);
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
