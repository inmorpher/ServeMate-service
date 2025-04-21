import { UserDto } from '@servemate/dto';
import { NextFunction, Request, Response } from 'express';
import { IUserService } from '../users/user.service.interface';

/**
 * Represents the decoded user information.
 * Contains only the necessary fields from UserDto for token operations.
 */
export type DecodedUser = Pick<UserDto, 'email' | 'role' | 'id'>;

/**
 * Base payload for JWT tokens.
 * Includes the user's id from UserDto and additional fields for JWT.
 *
 * @property {string} jti - JSON Web Token ID. A unique identifier for the token.
 * @property {number} iat - Issued At. The timestamp when the token was issued.
 */
export type BasePayload = Pick<UserDto, 'id'> & {
	jti: string;
	iat: number;
};

/**
 * Payload for access tokens.
 * Extends BasePayload by adding the user's email and role.
 *
 * @property {string} email - The user's email address.
 * @property {string} role - The user's role in the system.
 */
export type AccessTokenPayload = BasePayload & {
	email: string;
	role: string;
};

/**
 * Payload for refresh tokens.
 * Identical to BasePayload, contains no additional information.
 * Used to distinguish between access and refresh token types.
 */
export type RefreshTokenPayload = BasePayload;

export interface IAccessToken {
	accessToken: string;
	expiresIn: number;
}

export interface IRefreshToken extends IAccessToken {
	refreshToken: string;
}
/**
 * Interface for token service operations.
 */
/**
 * Interface representing a token service for handling token-related operations.
 */
export interface ITokenService {
	/**
	 * Authenticates the request by verifying the token in the authorization header.
	 *
	 * @param req - The request object.
	 * @param res - The response object.
	 * @param next - The next middleware function to pass control to the next middleware.
	 * @returns A Promise that resolves when authentication is complete.
	 */
	authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;

	/**
	 * Refreshes the given refresh token and generates new access and refresh tokens.
	 *
	 * @param refreshToken - The refresh token to refresh.
	 * @param userService - The user service to find the user by ID.
	 * @returns A Promise that resolves to an object containing the new access and refresh tokens, or null if the refresh token is invalid.
	 */
	refreshToken(refreshToken: string, userService: IUserService): Promise<IRefreshToken>;

	generateAccessToken(user: DecodedUser): Promise<IAccessToken>;

	generateRefreshToken(user: DecodedUser): Promise<any>;
}
