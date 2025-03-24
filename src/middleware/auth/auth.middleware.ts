import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../../../env';
import { IMiddleware } from '../../common/middleware.interface';
import { HTTPError } from '../../errors/http-error.class';
import { ITokenService } from '../../services/tokens/token.service.interface';
import { IUserService } from '../../services/users/user.service.interface';
import { TYPES } from '../../types';

export type DecodedUser = Pick<User, 'email' | 'role' | 'id'>;

@injectable()
export class AuthMiddleware implements IMiddleware {
	private tokenCache: NodeCache;

	constructor(
		@inject(TYPES.UserService) private userService: IUserService,
		@inject(TYPES.ITokenService) private tokenService: ITokenService
	) {
		this.tokenCache = new NodeCache({ stdTTL: 100 }); // Cache for 1 hour
	}

	/**
	 * Executes the authentication middleware.
	 *
	 * This method serves as an entry point for the authentication process,
	 * delegating the actual authentication logic to the `authenticate` method.
	 *
	 * @param req - The Express request object.
	 * @param res - The Express response object.
	 * @param next - The Express next function to pass control to the next middleware.
	 * @returns void
	 */
	execute(req: Request, res: Response, next: NextFunction): void {
		this.authenticate(req, res, next);
	}

	/**
	 * Generates a JSON Web Token (JWT) for user authentication.
	 *
	 * This function creates a JWT containing user information and additional claims.
	 * The token is signed using the JWT_SECRET from the environment configuration.
	 *
	 * @param user - An object containing user information.
	 * @param user.email - The email address of the user.
	 * @param user.role - The role of the user in the system.
	 * @param user.id - The unique identifier of the user.
	 *
	 * @returns A string representing the signed JWT. This token can be used for authenticating
	 * subsequent requests from the user.
	 */
	public generateToken(user: DecodedUser): string {
		const payload = {
			id: user.id,
			email: user.email,
			role: user.role,
			jti: uuidv4(),
			iat: Math.floor(Date.now() / 1000),
		};

		return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });
	}

	/**
	 * Authenticates the user based on the authorization header in the request.
	 *
	 * This method extracts the JWT token from the authorization header, verifies it,
	 * and attaches the decoded user information to the request object. It also
	 * implements caching to improve performance for subsequent requests with the same token.
	 *
	 * @param req - The Express request object containing the authorization header.
	 * @param res - The Express response object (unused in this method but required by Express middleware signature).
	 * @param next - The Express next function to pass control to the next middleware or to handle errors.
	 * @returns A Promise that resolves when authentication is complete. The function doesn't return a value directly,
	 *          but it calls `next()` to continue the middleware chain or passes an error to `next()` if authentication fails.
	 */
	public async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
		const authHeader = req.headers.authorization;
		if (!authHeader) {
			return next(new HTTPError(401, 'Header', 'No authorization header provided'));
		}

		const [bearer, token] = authHeader.split(' ');

		if (bearer !== 'Bearer' || !token) {
			return next(new HTTPError(401, 'Token', 'Invalid authorization format'));
		}

		try {
			let decoded: jwt.JwtPayload;
			const cachedUser = this.tokenCache.get<DecodedUser>(token);

			if (cachedUser) {
				decoded = cachedUser;
			} else {
				// decoded = await this.verifyToken(token, ENV.JWT_SECRET);
				decoded = await this.tokenService.verifyToken(token, ENV.JWT_SECRET);
				this.tokenCache.set(token, decoded);
			}

			(req as any).user = decoded;
			next();
		} catch (error) {
			this.handleAuthError(error, next);
		}
	}

	/**
	 * Verifies a JSON Web Token (JWT) asynchronously.
	 *
	 * This method wraps the synchronous jwt.verify function in a Promise to allow for
	 * asynchronous token verification. It checks the validity of the provided token
	 * against the given secret.
	 *
	 * @param token - The JWT string to verify.
	 * @param secret - The secret key used to verify the token's signature.
	 * @returns A Promise that resolves with the decoded payload of the token if verification is successful.
	 * @throws Will reject the Promise with an error if token verification fails.
	 */
	private async verifyToken(token: string, secret: string): Promise<jwt.JwtPayload> {
		return new Promise((resolve, reject) => {
			jwt.verify(token, secret, (err, decoded) => {
				if (err) reject(err);
				else resolve(decoded as jwt.JwtPayload);
			});
		});
	}

	/**
	 * Handles authentication errors and passes appropriate HTTP errors to the next middleware.
	 *
	 * This method checks the type of error encountered during authentication and creates
	 * a corresponding HTTPError with an appropriate status code and message. It then passes
	 * this error to the next middleware for further handling.
	 *
	 * @param error - The error object caught during the authentication process.
	 *                This can be any type of error, but specific handling is provided for
	 *                jwt.TokenExpiredError and jwt.JsonWebTokenError.
	 * @param next - The Express next function used to pass control to the next middleware,
	 *               typically used here to pass the created HTTPError.
	 * @returns void - This method doesn't return a value, but calls `next` with an HTTPError.
	 */
	private handleAuthError(error: any, next: NextFunction): void {
		if (error instanceof jwt.TokenExpiredError) {
			return next(new HTTPError(401, 'Token', 'Token has expired'));
		}
		if (error instanceof jwt.JsonWebTokenError) {
			return next(new HTTPError(401, 'Token', 'Invalid token'));
		}
		return next(new HTTPError(500, 'Authentication', 'An error occurred during authentication'));
	}

	/**
	 * Refreshes the user's authentication tokens.
	 *
	 * This method verifies the provided refresh token, and if valid, generates new access and refresh tokens.
	 *
	 * @param refreshToken - The current refresh token to be verified and used for generating new tokens.
	 * @returns A Promise that resolves to an object containing new access and refresh tokens if successful, or null if the refresh fails.
	 *          The returned object has the following structure:
	 *          - accessToken: A new JWT access token for authenticating API requests.
	 *          - refreshToken: A new refresh token for obtaining future access tokens.
	 * @throws Will not throw errors directly, but returns null if token verification fails or any other error occurs.
	 */
	public async refreshToken(
		refreshToken: string
	): Promise<{ accessToken: string; refreshToken: string } | null> {
		try {
			const decoded = (await this.tokenService.verifyToken(
				refreshToken,
				ENV.JWT_REFRESH
			)) as DecodedUser;

			console.log('Decoded refresh token:', decoded);

			const currentUser = await this.userService.findUserById(decoded.id);
			if (!currentUser) {
				return null;
			}

			console.log('Current user:', currentUser);
			const user = { id: currentUser.id, email: currentUser.email, role: currentUser.role };

			// const newAccessToken = this.generateToken(user);
			// const newRefreshToken = this.generateRefreshToken(user);
			const newAccessToken = await this.tokenService.generateToken(user, false);
			const newRefreshToken = await this.tokenService.generateToken(user, true);

			this.tokenCache.del(refreshToken);

			return { accessToken: newAccessToken, refreshToken: newRefreshToken };
		} catch (error) {
			return null;
		}
	}

	/**
	 * Generates a refresh token for the given user.
	 *
	 * This function creates a JSON Web Token (JWT) that serves as a refresh token,
	 * which can be used to obtain new access tokens without requiring the user to re-authenticate.
	 *
	 * @param user - An object containing the user's id.
	 * @param user.id - The unique identifier of the user.
	 *
	 * @returns A string representing the signed JWT refresh token. This token can be used
	 * to obtain new access tokens when the current access token expires.
	 */
	public generateRefreshToken(user: Pick<DecodedUser, 'id'>) {
		const payload = {
			id: user.id,
			jti: uuidv4(),
			iat: Math.floor(Date.now() / 1000),
		};

		return jwt.sign(payload, ENV.JWT_REFRESH, { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN });
	}
}
