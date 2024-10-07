import { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { CacheMiddleware } from './cache.middleware';

describe('CacheMiddleware', () => {
	let cacheMiddleware: CacheMiddleware;
	let mockCache: NodeCache;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;

	beforeEach(() => {
		mockCache = new NodeCache();
		cacheMiddleware = new CacheMiddleware(mockCache);
		mockRequest = {
			url: '/test',
		};
		mockResponse = {
			json: jest.fn(),
		};
		nextFunction = jest.fn();
	});

	describe('execute', () => {
		it('should return cached data when it exists for the given URL', () => {
			const cachedData = { id: 1, name: 'John Doe' };
			jest.spyOn(mockCache, 'get').mockReturnValue(cachedData);

			cacheMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockCache.get).toHaveBeenCalledWith('users_/test');
			expect(mockResponse.json).toHaveBeenCalledWith(cachedData);
			expect(nextFunction).not.toHaveBeenCalled();
		});

		it("should cache new data when it doesn't exist in the cache", () => {
			jest.spyOn(mockCache, 'get').mockReturnValue(undefined);
			const setCacheSpy = jest.spyOn(mockCache, 'set');

			const responseData = { id: 2, name: 'Jane Doe' };

			// Сохраняем оригинальный шпион
			const originalJsonSpy = mockResponse.json as jest.Mock;

			// Переопределяем json метод для имитации поведения middleware
			mockResponse.json = jest.fn().mockImplementation(function (this: Response, body) {
				setCacheSpy.mockImplementation(() => true); // Имитируем успешную установку кэша
				originalJsonSpy(body); // Вызываем оригинальный шпион
				return this;
			});

			cacheMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockCache.get).toHaveBeenCalledWith('users_/test');
			expect(nextFunction).toHaveBeenCalled();

			// Симулируем вызов json в middleware
			(mockResponse as any).json(responseData);

			expect(originalJsonSpy).toHaveBeenCalledWith(responseData);
			expect(setCacheSpy).toHaveBeenCalledWith('users_/test', responseData, 60000);
		});
	});
});
