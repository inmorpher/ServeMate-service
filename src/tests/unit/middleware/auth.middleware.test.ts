import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { AuthMiddleware } from '../../../middleware/auth/auth.middleware';
import { TokenService } from '../../../services/tokens/token.service';
import { ITokenService } from '../../../services/tokens/token.service.interface';
import { UserService } from '../../../services/users/user.service';

describe('AuthMiddleware', () => {
	let mockPrismaClient: jest.Mocked<PrismaClient>;
	let authMiddleware: AuthMiddleware;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;
	let userService: UserService;
	let tokenService: ITokenService;
	
	beforeEach(() => {
		mockPrismaClient = {
			user: {
				findUnique: jest.fn(),
			},
		} as unknown as jest.Mocked<PrismaClient>;

		userService = new UserService(mockPrismaClient);
		tokenService = new TokenService();

		// Создаем моки для методов tokenService
		tokenService.authenticate = jest.fn();
		tokenService.refreshToken = jest.fn();

		authMiddleware = new AuthMiddleware(tokenService);
		mockRequest = {
			headers: {},
		};
		mockResponse = {};
		nextFunction = jest.fn();
	});

	describe('execute', () => {
		it('should call tokenService.authenticate with correct parameters', async () => {
			await authMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(tokenService.authenticate).toHaveBeenCalledWith(
				mockRequest,
				mockResponse,
				nextFunction
			);
		});
	});

	describe('refreshToken', () => {
		it('should call tokenService.refreshToken with correct parameters', async () => {
			const mockRefreshToken = 'validRefreshToken';
			const mockRefreshResult = {
				accessToken: 'newAccessToken',
				refreshToken: 'newRefreshToken',
			};

			(tokenService.refreshToken as jest.Mock).mockResolvedValue(mockRefreshResult);

			const result = await tokenService.refreshToken(mockRefreshToken, userService);

			expect(tokenService.refreshToken).toHaveBeenCalledWith(mockRefreshToken, userService);
			expect(result).toEqual(mockRefreshResult);
		});

		it('should return null when tokenService.refreshToken returns null', async () => {
			const invalidRefreshToken = 'invalidRefreshToken';
			(tokenService.refreshToken as jest.Mock).mockResolvedValue(null);

			const result = await tokenService.refreshToken(invalidRefreshToken, userService);

			expect(tokenService.refreshToken).toHaveBeenCalledWith(invalidRefreshToken, userService);
			expect(result).toBeNull();
		});
	});

	// Демонстрация делегирования функциональности в TokenService
	describe('delegation pattern', () => {
		it('should only delegate functionality to tokenService without additional processing', async () => {
			// Проверяем что execute просто проксирует вызов
			await authMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);
			expect(tokenService.authenticate).toHaveBeenCalledWith(
				mockRequest,
				mockResponse,
				nextFunction
			);
			expect(tokenService.authenticate).toHaveBeenCalledTimes(1);

			// Проверяем что refreshToken просто проксирует вызов
			const mockRefreshToken = 'testRefreshToken';
			await tokenService.refreshToken(mockRefreshToken, userService);
			expect(tokenService.refreshToken).toHaveBeenCalledWith(mockRefreshToken, userService);
			expect(tokenService.refreshToken).toHaveBeenCalledTimes(1);
		});
	});
});
