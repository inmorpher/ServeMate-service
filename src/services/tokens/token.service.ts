import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import 'reflect-metadata';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../../../env';
import {
	AccessTokenPayload,
	DecodedUser,
	ITokenService,
	RefreshTokenPayload,
} from './token.service.interface';

/**
 * Generates a JWT token for the given user.
 *
 * @param user - The user object containing id, email, and role.
 * @param isRefreshToken - A flag indicating whether to generate a refresh token (default: false).
 * @returns A string representing the generated JWT token.
 */
@injectable()
export class TokenService implements ITokenService {
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
				id: user.id,
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

	/**
	 * Verifies the given JWT token.
	 *
	 * @param token - The JWT token to verify.
	 * @param secret - The secret key used to verify the token.
	 * @returns A Promise that resolves to the decoded user information (DecodedUser) if the token is valid.
	 * @throws Will reject the promise if the token is invalid or expired.
	 */
	async verifyToken(token: string, secret: string): Promise<DecodedUser> {
		return new Promise((resolve, reject) => {
			jwt.verify(token, secret, (err, decoded) => {
				if (err) {
					reject(err);
				}
				resolve(decoded as DecodedUser);
			});
		});
	}
}
