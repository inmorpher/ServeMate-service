import { UserRole } from '@servemate/dto';
import jwt from 'jsonwebtoken';
import 'reflect-metadata';
import { ENV } from '../../../../env';
import { TokenService } from '../../../services/tokens/token.service';
import {
	AccessTokenPayload,
	DecodedUser,
	RefreshTokenPayload,
} from '../../../services/tokens/token.service.interface';

describe('TokenService', () => {
	let tokenService: TokenService;
	let mockUser: DecodedUser;

	beforeEach(() => {
		tokenService = new TokenService();
		mockUser = {
			id: 1,
			email: 'test@example.com',
			role: UserRole.USER,
		};
		jest.clearAllMocks();
	});

	describe('generateToken', () => {
		it('should generate a valid access token with correct payload for a given user', async () => {
			const mockUser: DecodedUser = {
				id: 1,
				email: 'test@example.com',
				role: UserRole.USER,
			};

			const token = await tokenService.generateToken(mockUser);

			expect(token).toBeDefined();
			expect(typeof token).toBe('string');

			const decodedToken = jwt.decode(token) as AccessTokenPayload;
			expect(decodedToken).toBeDefined();
			expect(decodedToken.id).toBe(mockUser.id);
			expect(decodedToken.email).toBe(mockUser.email);
			expect(decodedToken.role).toBe(mockUser.role);
			expect(decodedToken.jti).toBeDefined();
			expect(decodedToken.iat).toBeDefined();

			const currentTime = Math.floor(Date.now() / 1000);
			expect(decodedToken.iat).toBeLessThanOrEqual(currentTime);
			expect(decodedToken.iat).toBeGreaterThan(currentTime - 10);

			jest.spyOn(jwt, 'sign');
			await tokenService.generateToken(mockUser);
			expect(jwt.sign).toHaveBeenCalledWith(
				expect.objectContaining({
					id: mockUser.id,
					email: mockUser.email,
					role: mockUser.role,
					jti: expect.any(String),
					iat: expect.any(Number),
				}),
				ENV.JWT_SECRET,
				{ expiresIn: ENV.JWT_EXPIRES_IN },
				expect.any(Function)
			);
		});

		it('should generate a valid refresh token with correct payload for a given user', async () => {
			const mockUser: DecodedUser = {
				id: 1,
				email: 'test@example.com',
				role: UserRole.USER,
			};

			const refreshToken = await tokenService.generateToken(mockUser, true);

			expect(refreshToken).toBeDefined();
			expect(typeof refreshToken).toBe('string');

			const decodedToken = jwt.decode(refreshToken) as RefreshTokenPayload;
			expect(decodedToken).toBeDefined();
			expect(decodedToken.id).toBe(mockUser.id);
			expect(decodedToken.jti).toBeDefined();
			expect(decodedToken.iat).toBeDefined();

			const currentTime = Math.floor(Date.now() / 1000);
			expect(decodedToken.iat).toBeLessThanOrEqual(currentTime);
			expect(decodedToken.iat).toBeGreaterThan(currentTime - 10);

			jest.spyOn(jwt, 'sign');
			await tokenService.generateToken(mockUser, true);
			expect(jwt.sign).toHaveBeenCalledWith(
				expect.objectContaining({
					id: mockUser.id,
					jti: expect.any(String),
					iat: expect.any(Number),
				}),
				ENV.JWT_REFRESH,
				{ expiresIn: ENV.JWT_REFRESH_EXPIRES_IN },
				expect.any(Function)
			);
		});

		it('should use different secrets for access and refresh tokens', async () => {
			const mockUser: DecodedUser = {
				id: 1,
				email: 'test@example.com',
				role: UserRole.USER,
			};

			jest.spyOn(jwt, 'sign');

			// Generate access token
			await tokenService.generateToken(mockUser);

			// Generate refresh token
			await tokenService.generateToken(mockUser, true);

			expect(jwt.sign).toHaveBeenCalledTimes(2);

			// Check if the first call (access token) used JWT_SECRET
			expect(jwt.sign).toHaveBeenNthCalledWith(
				1,
				expect.any(Object),
				ENV.JWT_SECRET,
				expect.objectContaining({ expiresIn: ENV.JWT_EXPIRES_IN }),
				expect.any(Function)
			);

			// Check if the second call (refresh token) used JWT_REFRESH
			expect(jwt.sign).toHaveBeenNthCalledWith(
				2,
				expect.any(Object),
				ENV.JWT_REFRESH,
				expect.objectContaining({ expiresIn: ENV.JWT_REFRESH_EXPIRES_IN }),
				expect.any(Function)
			);
		});

		it('should use different expiration times for access and refresh tokens', async () => {
			const mockUser: DecodedUser = {
				id: 1,
				email: 'test@example.com',
				role: UserRole.USER,
			};

			jest.spyOn(jwt, 'sign');

			// Generate access token
			await tokenService.generateToken(mockUser);

			// Generate refresh token
			await tokenService.generateToken(mockUser, true);

			expect(jwt.sign).toHaveBeenCalledTimes(2);

			// Check if the first call (access token) used JWT_EXPIRES_IN
			expect(jwt.sign).toHaveBeenNthCalledWith(
				1,
				expect.any(Object),
				ENV.JWT_SECRET,
				expect.objectContaining({ expiresIn: ENV.JWT_EXPIRES_IN }),
				expect.any(Function)
			);

			// Check if the second call (refresh token) used JWT_REFRESH_EXPIRES_IN
			expect(jwt.sign).toHaveBeenNthCalledWith(
				2,
				expect.any(Object),
				ENV.JWT_REFRESH,
				expect.objectContaining({ expiresIn: ENV.JWT_REFRESH_EXPIRES_IN }),
				expect.any(Function)
			);
		});

		it('should include email and role in access token payload but not in refresh token payload', async () => {
			const mockUser: DecodedUser = {
				id: 1,
				email: 'test@example.com',
				role: UserRole.USER,
			};

			jest.spyOn(jwt, 'sign');

			// Generate access token
			await tokenService.generateToken(mockUser);

			// Generate refresh token
			await tokenService.generateToken(mockUser, true);

			expect(jwt.sign).toHaveBeenCalledTimes(2);

			// Check if the first call (access token) included email and role
			expect(jwt.sign).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					id: mockUser.id,
					email: mockUser.email,
					role: mockUser.role,
					jti: expect.any(String),
					iat: expect.any(Number),
				}),
				ENV.JWT_SECRET,
				expect.objectContaining({ expiresIn: ENV.JWT_EXPIRES_IN }),
				expect.any(Function)
			);

			// Check if the second call (refresh token) did not include email and role
			expect(jwt.sign).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					id: mockUser.id,
					jti: expect.any(String),
					iat: expect.any(Number),
				}),
				ENV.JWT_REFRESH,
				expect.objectContaining({ expiresIn: ENV.JWT_REFRESH_EXPIRES_IN }),
				expect.any(Function)
			);

			// Ensure email and role are not present in the refresh token payload
			expect(jwt.sign).not.toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					email: expect.any(String),
					role: expect.any(String),
				}),
				expect.any(String),
				expect.any(Object),
				expect.any(Function)
			);
		});
	});

	describe('verifyToken', () => {
		it('should verify a valid access token and return the decoded user information', async () => {
			const mockUser: DecodedUser = {
				id: 1,
				email: 'test@example.com',
				role: UserRole.USER,
			};

			const token = await tokenService.generateToken(mockUser);
			const decodedUser = await tokenService.verifyToken(token, ENV.JWT_SECRET);

			expect(decodedUser).toBeDefined();
			expect(decodedUser.id).toBe(mockUser.id);
			expect(decodedUser.email).toBe(mockUser.email);
			expect(decodedUser.role).toBe(mockUser.role);
		});

		it('should verify a valid refresh token and return the decoded user information', async () => {
			const mockUser: DecodedUser = {
				id: 1,
				email: 'test@example.com',
				role: UserRole.USER,
			};

			const refreshToken = await tokenService.generateToken(mockUser, true);
			const decodedUser = await tokenService.verifyToken(refreshToken, ENV.JWT_REFRESH);

			expect(decodedUser).toBeDefined();
			expect(decodedUser.id).toBe(mockUser.id);

			// Check for jti and iat in the full decoded token, not in DecodedUser
			const fullDecodedToken = jwt.decode(refreshToken) as any;
			expect(fullDecodedToken.jti).toBeDefined();
			expect(fullDecodedToken.iat).toBeDefined();

			// Ensure that email and role are not present in the decoded refresh token
			expect(decodedUser.email).toBeUndefined();
			expect(decodedUser.role).toBeUndefined();
		});

		it('should reject an expired token during verification', async () => {
			const mockUser: DecodedUser = {
				id: 1,
				email: 'test@example.com',
				role: UserRole.USER,
			};

			// Generate a token
			const token = await tokenService.generateToken(mockUser);

			// Mock the jwt.verify function to simulate an expired token
			jest.spyOn(jwt, 'verify').mockImplementation((token, secret, options, callback) => {
				if (typeof callback === 'function') {
					callback(new jwt.TokenExpiredError('jwt expired', new Date()), undefined);
				} else {
					throw new jwt.TokenExpiredError('jwt expired', new Date());
				}
			});

			// Attempt to verify the "expired" token
			await expect(tokenService.verifyToken(token, ENV.JWT_SECRET)).rejects.toThrow('jwt expired');

			// Restore the original jwt.verify implementation
			jest.restoreAllMocks();
		});

		it('should reject a token with an invalid signature during verification', async () => {
			const mockUser: DecodedUser = {
				id: 1,
				email: 'test@example.com',
				role: UserRole.USER,
			};

			// Generate a valid token
			const validToken = await tokenService.generateToken(mockUser);

			// Modify the token to make it invalid
			const invalidToken = validToken.slice(0, -5) + 'invalid';

			// Attempt to verify the invalid token
			await expect(tokenService.verifyToken(invalidToken, ENV.JWT_SECRET)).rejects.toThrow(
				'invalid signature'
			);
		});

		it('should generate unique JTI (JWT ID) for each token', async () => {
			const mockUser: DecodedUser = {
				id: 1,
				email: 'test@example.com',
				role: UserRole.USER,
			};

			const token1 = await tokenService.generateToken(mockUser);
			const token2 = await tokenService.generateToken(mockUser);

			const decodedToken1 = jwt.decode(token1) as AccessTokenPayload;
			const decodedToken2 = jwt.decode(token2) as AccessTokenPayload;

			expect(decodedToken1.jti).toBeDefined();
			expect(decodedToken2.jti).toBeDefined();
			expect(decodedToken1.jti).not.toBe(decodedToken2.jti);
		});
	});
});
