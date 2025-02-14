import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../../../../env';
import { HTTPError } from '../../../errors/http-error.class';
import { AuthMiddleware, DecodedUser } from '../../../middleware/auth/auth.middleware';

describe('AuthMiddleware', () => {
	let authMiddleware: AuthMiddleware;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;

	beforeEach(() => {
		authMiddleware = new AuthMiddleware();
		mockRequest = {
			headers: {},
		};
		mockResponse = {};
		nextFunction = jest.fn();
	});
	describe('generateToken', () => {
		const mockDecodedUser: DecodedUser = {
			id: 1,
			email: 'test@example.com',
			role: 'USER',
		};

		it('should authenticate successfully with a valid token', async () => {
			const mockToken = 'validToken';
			mockRequest.headers = { authorization: `Bearer ${mockToken}` };
			jest.spyOn(authMiddleware['tokenCache'], 'get').mockReturnValue(null);
			jest.spyOn(authMiddleware as any, 'verifyToken').mockResolvedValue(mockDecodedUser);
			jest.spyOn(authMiddleware['tokenCache'], 'set');

			await authMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(authMiddleware['tokenCache'].get).toHaveBeenCalledWith(mockToken);
			expect(authMiddleware['verifyToken']).toHaveBeenCalledWith(mockToken, ENV.JWT_SECRET);
			expect(authMiddleware['tokenCache'].set).toHaveBeenCalledWith(mockToken, mockDecodedUser);
			expect((mockRequest as any).user).toEqual(mockDecodedUser);
			expect(nextFunction).toHaveBeenCalled();
		});

		it('should correctly set the expiration time for generated tokens', () => {
			const mockUser = { id: 1, email: 'test@example.com', role: 'USER' };
			const authMiddleware = new AuthMiddleware();

			// Mock the ENV values
			const originalJwtExpiresIn = ENV.JWT_EXPIRES_IN;
			const originalJwtRefreshExpiresIn = ENV.JWT_REFRESH_EXPIRES_IN;
			ENV.JWT_EXPIRES_IN = '1h';
			ENV.JWT_REFRESH_EXPIRES_IN = '7d';

			const token = authMiddleware.generateToken(mockDecodedUser);
			const refreshToken = authMiddleware.generateRefreshToken(mockUser);

			const decodedToken = jwt.decode(token) as jwt.JwtPayload;
			const decodedRefreshToken = jwt.decode(refreshToken) as jwt.JwtPayload;

			const currentTime = Math.floor(Date.now() / 1000);

			expect(decodedToken.exp).toBe(currentTime + 3600); // 1 hour in seconds
			expect(decodedRefreshToken.exp).toBe(currentTime + 604800); // 7 days in seconds

			// Restore original ENV values
			ENV.JWT_EXPIRES_IN = originalJwtExpiresIn;
			ENV.JWT_REFRESH_EXPIRES_IN = originalJwtRefreshExpiresIn;
		});

		it('should include the correct payload information in generated tokens', () => {
			const authMiddleware = new AuthMiddleware();
			const mockUser = { id: 1, email: 'test@example.com', role: 'USER' };
			const token = authMiddleware.generateToken(mockDecodedUser);
			const refreshToken = authMiddleware.generateRefreshToken(mockUser);

			const decodedToken = jwt.decode(token) as jwt.JwtPayload;
			const decodedRefreshToken = jwt.decode(refreshToken) as jwt.JwtPayload;

			expect(decodedToken).toMatchObject({
				id: mockUser.id,
				email: mockUser.email,
				role: mockUser.role,
			});
			expect(decodedToken).toHaveProperty('jti');
			expect(decodedToken).toHaveProperty('iat');
			expect(decodedToken).toHaveProperty('exp');

			expect(decodedRefreshToken).toMatchObject({
				id: mockUser.id,
			});
			expect(decodedRefreshToken).toHaveProperty('jti');
			expect(decodedRefreshToken).toHaveProperty('iat');
			expect(decodedRefreshToken).toHaveProperty('exp');
		});
	});

	describe('verifyToken', () => {
		it('should return a 401 error when no authorization header is provided', async () => {
			mockRequest.headers = {};
			const nextSpy = jest.fn();

			await authMiddleware.execute(mockRequest as Request, mockResponse as Response, nextSpy);

			expect(nextSpy).toHaveBeenCalledWith(expect.any(HTTPError));
			expect(nextSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					statusCode: 401,
					context: 'Header',
					message: 'No authorization header provided',
				})
			);
		});

		it('should return a 401 error when the authorization format is invalid', async () => {
			mockRequest.headers = { authorization: 'InvalidFormat' };
			const nextSpy = jest.fn();

			await authMiddleware.execute(mockRequest as Request, mockResponse as Response, nextSpy);

			expect(nextSpy).toHaveBeenCalledWith(expect.any(HTTPError));
			expect(nextSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					statusCode: 401,
					context: 'Token',
					message: 'Invalid authorization format',
				})
			);
		});
	});

	describe('caching tokens', () => {
		it('should use cached user data when available instead of verifying the token again', async () => {
			const mockToken = 'cachedToken';
			const mockCachedUser: DecodedUser = {
				id: 1,
				email: 'cached@example.com',
				role: 'USER',
			};
			mockRequest.headers = { authorization: `Bearer ${mockToken}` };
			jest.spyOn(authMiddleware['tokenCache'], 'get').mockReturnValue(mockCachedUser);
			jest.spyOn(authMiddleware as any, 'verifyToken');

			await authMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(authMiddleware['tokenCache'].get).toHaveBeenCalledWith(mockToken);
			expect(authMiddleware['verifyToken']).not.toHaveBeenCalled();
			expect((mockRequest as any).user).toEqual(mockCachedUser);
			expect(nextFunction).toHaveBeenCalled();
		});
	});

	describe('Expired tokens', () => {
		it('should handle and return appropriate errors for expired tokens', async () => {
			const mockExpiredToken = 'expiredToken';
			mockRequest.headers = { authorization: `Bearer ${mockExpiredToken}` };
			jest.spyOn(authMiddleware['tokenCache'], 'get').mockReturnValue(null);
			jest
				.spyOn(authMiddleware as any, 'verifyToken')
				.mockRejectedValue(new jwt.TokenExpiredError('Token expired', new Date()));
			const nextSpy = jest.fn();

			await authMiddleware.execute(mockRequest as Request, mockResponse as Response, nextSpy);

			expect(authMiddleware['tokenCache'].get).toHaveBeenCalledWith(mockExpiredToken);
			expect(authMiddleware['verifyToken']).toHaveBeenCalledWith(mockExpiredToken, ENV.JWT_SECRET);
			expect(nextSpy).toHaveBeenCalledWith(expect.any(HTTPError));
			expect(nextSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					statusCode: 401,
					context: 'Token',
					message: 'Token has expired',
				})
			);
		});
	});

	describe('invalid tokens', () => {
		it('should handle and return appropriate errors for invalid tokens', async () => {
			const mockInvalidToken = 'invalidToken';
			mockRequest.headers = { authorization: `Bearer ${mockInvalidToken}` };
			jest.spyOn(authMiddleware['tokenCache'], 'get').mockReturnValue(null);
			jest
				.spyOn(authMiddleware as any, 'verifyToken')
				.mockRejectedValue(new jwt.JsonWebTokenError('Invalid token'));
			const nextSpy = jest.fn();

			await authMiddleware.execute(mockRequest as Request, mockResponse as Response, nextSpy);

			expect(authMiddleware['tokenCache'].get).toHaveBeenCalledWith(mockInvalidToken);
			expect(authMiddleware['verifyToken']).toHaveBeenCalledWith(mockInvalidToken, ENV.JWT_SECRET);
			expect(nextSpy).toHaveBeenCalledWith(expect.any(HTTPError));
			expect(nextSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					statusCode: 401,
					context: 'Token',
					message: 'Invalid token',
				})
			);
		});
	});

	describe('generateRefreshToken', () => {
		it('should generate a new access token and refresh token when refreshing with a valid refresh token', async () => {
			const mockUser = { id: 1, email: 'test@example.com', role: 'USER' };
			const mockRefreshToken = 'validRefreshToken';
			const mockNewAccessToken = 'newAccessToken';
			const mockNewRefreshToken = 'newRefreshToken';

			jest.spyOn(authMiddleware as any, 'verifyToken').mockResolvedValue(mockUser);
			jest.spyOn(authMiddleware, 'generateToken').mockReturnValue(mockNewAccessToken);
			jest.spyOn(authMiddleware, 'generateRefreshToken').mockReturnValue(mockNewRefreshToken);

			const result = await authMiddleware.refreshToken(mockRefreshToken);

			expect(authMiddleware['verifyToken']).toHaveBeenCalledWith(mockRefreshToken, ENV.JWT_REFRESH);
			expect(authMiddleware.generateToken).toHaveBeenCalledWith(mockUser);
			expect(authMiddleware.generateRefreshToken).toHaveBeenCalledWith(mockUser);
			expect(result).toEqual({
				accessToken: mockNewAccessToken,
				refreshToken: mockNewRefreshToken,
			});
		});

		it('should return null when attempting to refresh with an invalid refresh token', async () => {
			const invalidRefreshToken = 'invalidRefreshToken';
			jest
				.spyOn(authMiddleware as any, 'verifyToken')
				.mockRejectedValue(new Error('Invalid token'));

			const result = await authMiddleware.refreshToken(invalidRefreshToken);

			expect(authMiddleware['verifyToken']).toHaveBeenCalledWith(
				invalidRefreshToken,
				ENV.JWT_REFRESH
			);
			expect(result).toBeNull();
		});
	});
});
