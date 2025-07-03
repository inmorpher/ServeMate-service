import { NextFunction, Request, Response } from 'express';
import { TokenService } from '../../../services/tokens/token.service';
import { IUserService } from '../../../services/users/user.service.interface';
import { DecodedUser, IRefreshToken } from '../../../services/tokens/token.service.interface';
import { HTTPError } from '../../../errors/http-error.class';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../../../../env';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('node-cache');
jest.mock('uuid');
jest.mock('../../../utils/expireEncoder', () => ({
	parseExpiresIn: jest.fn((time) => {
		if (typeof time === 'string') {
			if (time.endsWith('s')) return parseInt(time) * 1000;
			if (time.endsWith('h')) return parseInt(time) * 3600 * 1000;
		}
		return time as number;
	}),
}));

// Mock ENV variables
jest.mock('../../../../env', () => ({
	ENV: {
		TOKEN_CACHE_TTL: 3600,
		JWT_SECRET: 'test-secret',
		JWT_REFRESH: 'test-refresh-secret',
		JWT_EXPIRES_IN: '1h',
		JWT_REFRESH_EXPIRES_IN: '24h',
	},
}));

const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedUuidV4 = uuidv4 as jest.Mock;

describe('TokenService', () => {
	let tokenService: TokenService;
	let mockUserService: jest.Mocked<IUserService>;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;

	const user: DecodedUser = { id: 1, email: 'test@test.com', role: 'USER' };

	beforeEach(() => {
		tokenService = new TokenService();
		mockUserService = {
			findUserById: jest.fn(),
		} as any;
		mockRequest = {
			headers: {},
		};
		mockResponse = {
			cookie: jest.fn(),
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};
		nextFunction = jest.fn();
		mockedUuidV4.mockReturnValue('mocked-uuid');
		(NodeCache.prototype.get as jest.Mock).mockClear();
		(NodeCache.prototype.set as jest.Mock).mockClear();
		(NodeCache.prototype.del as jest.Mock).mockClear();
		mockedJwt.decode.mockReturnValue({ exp: (Date.now() / 1000) + 3600 }); // Mock decode to return a valid expiration time
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('generateAccessToken', () => {
		it('should generate an access token and cache it', async () => {
			const token = 'access-token';
			mockedJwt.sign.mockImplementation((payload, secret, options, callback) => {
				callback?.(null, token);
			});

			const result = await tokenService.generateAccessToken(user);

			expect(result.accessToken).toBe(token);
			expect(result.expiresIn).toBe(3600000); // 1h in ms
			expect(NodeCache.prototype.set).toHaveBeenCalledWith(token, expect.any(Object));
			expect(mockedJwt.sign).toHaveBeenCalledWith(
				expect.objectContaining({ email: user.email }),
				ENV.JWT_SECRET,
				expect.any(Object),
				expect.any(Function),
			);
		});
	});

	describe('generateRefreshToken', () => {
		it('should generate a refresh token', async () => {
			const token = 'refresh-token';
			mockedJwt.sign.mockImplementation((payload, secret, options, callback) => {
				callback?.(null, token);
			});

			const result = await tokenService.generateRefreshToken(user);

			expect(result).toBe(token);
			expect(mockedJwt.sign).toHaveBeenCalledWith(
				expect.not.objectContaining({ email: user.email }), // Refresh token should not have extra data
				ENV.JWT_REFRESH,
				expect.any(Object),
				expect.any(Function),
			);
		});
	});

	describe('authenticate', () => {
		it('should fail if no authorization header is provided', async () => {
			await tokenService.authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
			expect(nextFunction).toHaveBeenCalledWith(new HTTPError(401, 'Header', 'No authorization header provided'));
		});

		it('should fail if authorization format is invalid', async () => {
			mockRequest.headers = { authorization: 'Invalid token' };
			await tokenService.authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
			expect(nextFunction).toHaveBeenCalledWith(new HTTPError(401, 'Token', 'Invalid authorization format'));
		});

		it('should fail on TokenExpiredError', async () => {
			mockRequest.headers = { authorization: 'Bearer expired-token' };
			mockedJwt.verify.mockImplementation((token, secret, options, callback) => {
				const cb = typeof options === 'function' ? options : callback;
				cb?.(new jwt.TokenExpiredError('jwt expired', new Date()), undefined);
			});

			await tokenService.authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
			expect(nextFunction).toHaveBeenCalledWith(new HTTPError(401, 'Token', 'Token has expired'));
		});

		it('should fail on JsonWebTokenError', async () => {
			mockRequest.headers = { authorization: 'Bearer invalid-token' };
			mockedJwt.verify.mockImplementation((token, secret, options, callback) => {
				const cb = typeof options === 'function' ? options : callback;
				cb?.(new jwt.JsonWebTokenError('invalid token'), undefined);
			});

			await tokenService.authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
			expect(nextFunction).toHaveBeenCalledWith(new HTTPError(401, 'Token', 'Invalid token'));
		});

		it('should successfully authenticate a valid token', async () => {
			mockRequest.headers = { authorization: 'Bearer valid-token' };
			mockedJwt.verify.mockImplementation((token, secret, options, callback) => {
				const cb = typeof options === 'function' ? options : callback;
				cb?.(null, user as any);
			});

			await tokenService.authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

			expect((mockRequest as any).user).toEqual(user);
			expect(nextFunction).toHaveBeenCalledWith();
		});
	});

	describe('refreshToken', () => {
		const refreshToken = 'valid-refresh-token';

		it('should throw an error if the refresh token is invalid', async () => {
			mockedJwt.verify.mockImplementation((token, secret, options, callback) => {
				const cb = typeof options === 'function' ? options : callback;
				cb?.(new jwt.JsonWebTokenError('Invalid token'), undefined);
			});

			await expect(tokenService.refreshToken(refreshToken, mockUserService)).rejects.toThrow(
				new HTTPError(401, 'Token', 'Invalid refresh token'),
			);
		});

		it('should throw an error if user is not found', async () => {
			mockedJwt.verify.mockImplementation((token, secret, options, callback) => {
				const cb = typeof options === 'function' ? options : callback;
				cb?.(null, { id: user.id } as any);
			});
			mockUserService.findUserById.mockResolvedValue(null);

			await expect(tokenService.refreshToken(refreshToken, mockUserService)).rejects.toThrow(
				new HTTPError(401, 'Token', 'User not found'),
			);
		});

		it('should successfully generate new tokens', async () => {
			const newAccessToken = 'new-access-token';
			const newRefreshToken = 'new-refresh-token';

			mockedJwt.verify.mockImplementation((token, secret, options, callback) => {
				const cb = typeof options === 'function' ? options : callback;
				cb?.(null, { id: user.id } as any);
			});
			mockUserService.findUserById.mockResolvedValue(user as any);

			// Mock sign for access and refresh tokens
			mockedJwt.sign
				.mockImplementationOnce((payload, secret, options, callback) => callback?.(null, newAccessToken))
				.mockImplementationOnce((payload, secret, options, callback) => callback?.(null, newRefreshToken));

			const result: IRefreshToken = await tokenService.refreshToken(refreshToken, mockUserService);

			expect(result.accessToken).toBe(newAccessToken);
			expect(result.refreshToken).toBe(newRefreshToken);
			expect(result.expiresIn).toBeDefined();
			expect(mockUserService.findUserById).toHaveBeenCalledWith(user.id);
		});
	});

	describe('verifyToken caching', () => {
		const token = 'cached-token';

		it('should return a cached user if available', async () => {
			(NodeCache.prototype.get as jest.Mock).mockReturnValue(user);

			// We need to call a public method to test the private `verifyToken`
			mockRequest.headers = { authorization: `Bearer ${token}` };
			await tokenService.authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(NodeCache.prototype.get).toHaveBeenCalledWith(token);
			expect(mockedJwt.verify).not.toHaveBeenCalled();
			expect((mockRequest as any).user).toEqual(user);
			expect(nextFunction).toHaveBeenCalledWith();
		});

		it('should verify the token and cache it if not in cache', async () => {
			(NodeCache.prototype.get as jest.Mock).mockReturnValue(undefined);
			mockedJwt.verify.mockImplementation((token, secret, options, callback) => {
				const cb = typeof options === 'function' ? options : callback;
				cb?.(null, user as any);
			});

			mockRequest.headers = { authorization: `Bearer ${token}` };
			await tokenService.authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(NodeCache.prototype.get).toHaveBeenCalledWith(token);
			expect(mockedJwt.verify).toHaveBeenCalled();
			expect(NodeCache.prototype.set).toHaveBeenCalledWith(token, user);
			expect((mockRequest as any).user).toEqual(user);
			expect(nextFunction).toHaveBeenCalledWith();
		});

		it('should throw and delete from cache if token is expired (pre-check)', async () => {
			const expiredToken = 'definitely-expired-token';
			const expiredTimestamp = Date.now() / 1000 - 60; // 1 minute ago
			(NodeCache.prototype.get as jest.Mock).mockReturnValue(undefined);
			mockedJwt.decode.mockReturnValue({ exp: expiredTimestamp });

			mockRequest.headers = { authorization: `Bearer ${expiredToken}` };
			await tokenService.authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockedJwt.decode).toHaveBeenCalledWith(expiredToken);
			expect(NodeCache.prototype.del).toHaveBeenCalledWith(expiredToken);
			expect(nextFunction).toHaveBeenCalledWith(new HTTPError(401, 'Token', 'Token has expired'));
		});
	});
});