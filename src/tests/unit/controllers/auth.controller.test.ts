import { UserRole } from '@prisma/client';
import { ValidatedUserData } from '@servemate/dto';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'inversify';
import { AuthenticationController } from '../../../controllers/auth/auth.controller';
import { ILogger } from '../../../services/logger/logger.service.interface';
import { ITokenService } from '../../../services/tokens/token.service.interface';
import { UserService } from '../../../services/users/user.service';
import { TYPES } from '../../../types';

describe('AuthenticationController', () => {
	let authController: AuthenticationController;
	let mockUserService: jest.Mocked<UserService>;
	let mockTokenService: jest.Mocked<ITokenService>;
	let mockLoggerService: jest.Mocked<ILogger>;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		const container = new Container();
		mockUserService = {
			validateUser: jest.fn(),
			updateUser: jest.fn(),
			findUserById: jest.fn(),
		} as any;

		mockTokenService = {
			generateAccessToken: jest.fn(),
			generateRefreshToken: jest.fn(),
			refreshToken: jest.fn(),
			verifyToken: jest.fn(),
		} as any;

		mockLoggerService = {
			log: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
		} as any;

		container.bind<UserService>(TYPES.UserService).toConstantValue(mockUserService);
		container.bind<ITokenService>(TYPES.ITokenService).toConstantValue(mockTokenService);
		container.bind<ILogger>(TYPES.ILogger).toConstantValue(mockLoggerService);

		authController = new AuthenticationController(
			mockLoggerService,
			mockTokenService,
			mockUserService
		);

		mockRequest = {
			body: {
				email: 'test@example.com',
				password: 'password123',
			},
		};

		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			cookie: jest.fn(),
			type: jest.fn().mockReturnThis(),
		};

		mockNext = jest.fn();
	});

	it('should respond with 200 and access token on successful login', async () => {
		const user = { id: 1, email: 'test@example.com', name: 'Test User', role: UserRole.USER };
		mockUserService.validateUser.mockResolvedValue(user);
		mockTokenService.generateAccessToken.mockResolvedValue({
			accessToken: 'accessToken',
			expiresIn: 3600,
		});
		mockTokenService.generateRefreshToken.mockResolvedValue('refreshToken');

		const okSpy = jest.spyOn(authController, 'ok');

		await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

		expect(okSpy).toHaveBeenCalledWith(mockResponse, {
			user,
			accessToken: 'accessToken',
			refreshToken: 'refreshToken',
			expiresIn: 3600,
		});

		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.json).toHaveBeenCalledWith({
			user,
			accessToken: 'accessToken',
			refreshToken: 'refreshToken',
			expiresIn: 3600,
		});

		okSpy.mockRestore();
	});

	it('should respond with 400 if credentials are invalid', async () => {
		mockUserService.validateUser.mockResolvedValue(null as unknown as ValidatedUserData);

		await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
	});

	it('should respond with 500 and call next with error when userService.validateUser throws an error', async () => {
		const error = new Error('Validation error');
		mockUserService.validateUser.mockRejectedValue(error);

		await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.json).not.toHaveBeenCalled();
		expect(mockNext).toHaveBeenCalledWith(error);
	});

	it('should respond with 500 and call next with error when tokenService.generateAccessToken throws an error during login', async () => {
		const user = { id: 1, email: 'test@example.com', name: 'Test User', role: UserRole.USER };
		mockUserService.validateUser.mockResolvedValue(user);
		const error = new Error('Token generation error');
		mockTokenService.generateAccessToken.mockRejectedValue(error);

		await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.json).not.toHaveBeenCalled();
		expect(mockNext).toHaveBeenCalledWith(error);
	});

	// it('should respond with 500 and call next with error when userService.updateUser throws an error', async () => {
	// 	const user = { id: 1, email: 'test@example.com', name: 'Test User', role: UserRole.USER };
	// 	mockUserService.validateUser.mockResolvedValue(user);
	// 	mockTokenService.generateAccessToken.mockResolvedValue({
	// 		accessToken: 'accessToken',
	// 		expiresIn: 3600,
	// 	});
	// 	mockTokenService.generateRefreshToken.mockResolvedValue('refreshToken');
	// 	const error = new Error('Update user error');
	// 	mockUserService.updateUser.mockRejectedValue(error);

	// 	await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

	// 	expect(mockResponse.status).not.toHaveBeenCalled();
	// 	expect(mockResponse.json).not.toHaveBeenCalled();
	// 	expect(mockNext).toHaveBeenCalledWith(error);
	// });

	it('should respond with 401 when refresh token is not provided in the refreshToken method', async () => {
		mockRequest.body = {};

		await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Refresh token not provided' });
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should respond with 500 and call next with error when tokenService.refreshToken throws an error', async () => {
		const error = new Error('Token verification error');
		mockRequest.body = { refreshToken: 'validRefreshToken' };
		mockTokenService.refreshToken.mockRejectedValue(error);

		await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.json).not.toHaveBeenCalled();
		expect(mockNext).toHaveBeenCalledWith(error);
	});

	it('should refresh token successfully and return new tokens', async () => {
		mockRequest.body = { refreshToken: 'validRefreshToken' };

		mockTokenService.refreshToken.mockResolvedValue({
			accessToken: 'newAccessToken',
			refreshToken: 'newRefreshToken',
			expiresIn: 3600,
		});

		await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.json).toHaveBeenCalledWith({
			accessToken: 'newAccessToken',
			refreshToken: 'newRefreshToken',
			expiresIn: 3600,
		});
	});

	it('should clear refresh token cookie and respond with 200 on successful logout', async () => {
		mockResponse.clearCookie = jest.fn();
		mockResponse.status = jest.fn().mockReturnThis();
		mockResponse.json = jest.fn();

		await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should respond with 500 and call next with error when an error occurs during logout', async () => {
		const error = new Error('Logout error');
		mockResponse.clearCookie = jest.fn(() => {
			throw error;
		});

		await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.json).not.toHaveBeenCalled();
		expect(mockNext).toHaveBeenCalledWith(error);
	});

	it('should respond with 401 when me endpoint is called without authenticated user', async () => {
		mockRequest.user = undefined;

		await authController.me(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Пользователь не аутентифицирован' });
	});
});
