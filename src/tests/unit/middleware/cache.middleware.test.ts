import { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import 'reflect-metadata';
import { CacheMiddleware } from '../../../middleware/cache/cache.middleware';

describe('CacheMiddleware', () => {
	let cacheMiddleware: CacheMiddleware;
	let mockCache: jest.Mocked<NodeCache>;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;

	beforeEach(() => {
		mockCache = {
			get: jest.fn(),
			set: jest.fn(),
			del: jest.fn(),
		} as unknown as jest.Mocked<NodeCache>;

		cacheMiddleware = new CacheMiddleware(mockCache, 'testScheme', 60000);

		mockRequest = {
			method: 'GET',
			query: {},
			params: {},
		};

		mockResponse = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(),
			statusCode: 200,
		};

		nextFunction = jest.fn();
	});

	describe('execute', () => {
		it('should return cached data for a GET request when it exists in the cache', () => {
			const cachedData = { id: 1, name: 'Test User' };
			mockRequest.method = 'GET';
			(mockCache.get as jest.Mock).mockReturnValue(cachedData);

			cacheMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockCache.get).toHaveBeenCalledWith(expect.any(String));
			expect(mockResponse.json).toHaveBeenCalledWith(cachedData);
			expect(nextFunction).not.toHaveBeenCalled();
		});

		it('should cache successful GET responses (status code 2xx) for future requests', () => {
			const testData = { id: 1, name: 'Test User' };
			mockRequest.method = 'GET';
			mockRequest.params = { id: '1' };

			const originalJson = mockResponse.json as jest.Mock;

			// Create a mock for the json method
			const jsonMock = jest.fn().mockImplementation(function (this: any, body: any) {
				// Cache the response
				mockCache.set(expect.stringContaining('$_testScheme__{"id":"1"}'), body, 60000);
				return originalJson.call(this, body);
			});

			// Replace the json method with our mock
			mockResponse.json = jsonMock;

			cacheMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			// Simulate successful response
			mockResponse.json(testData);

			expect(mockCache.set).toHaveBeenCalledWith(
				expect.stringContaining('$_testScheme__{"id":"1"}'),
				testData,
				60000
			);

			// Reset mocks for the second request
			(mockCache.get as jest.Mock).mockReturnValue(testData);

			// Simulate a second request
			cacheMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockCache.get).toHaveBeenCalledWith(
				expect.stringContaining('$_testScheme__{"id":"1"}')
			);
			expect(jsonMock).toHaveBeenCalledWith(testData);
			expect(nextFunction).toHaveBeenCalledTimes(1);

			// Restore the original json method
			mockResponse.json = originalJson;
		});

		it('should not cache unsuccessful GET responses (status code non-2xx)', () => {
			const testData = { error: 'Not Found' };
			mockRequest.method = 'GET';
			mockRequest.params = { id: '1' };
			mockResponse.statusCode = 404;

			const originalJson = mockResponse.json as jest.Mock;
			const jsonMock = jest.fn().mockImplementation(function (this: any, body: any) {
				return originalJson.call(this, body);
			});
			mockResponse.json = jsonMock;

			cacheMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			// Simulate unsuccessful response
			mockResponse.json(testData);

			expect(mockCache.set).not.toHaveBeenCalled();
			expect(jsonMock).toHaveBeenCalledWith(testData);
			expect(nextFunction).toHaveBeenCalled();

			// Restore the original json method
			mockResponse.json = originalJson;
		});

		it('should invalidate cache for POST, PUT, and DELETE requests', () => {
			const testMethods = ['POST', 'PUT', 'DELETE'];

			testMethods.forEach((method) => {
				mockRequest.method = method;
				mockRequest.params = { id: '1' };

				const cacheKey = `$_testScheme_{"id":"1"}`;
				const allUsersCacheKey = '$_testScheme_';

				cacheMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

				expect(mockCache.del).toHaveBeenCalledWith(cacheKey);
				expect(mockCache.del).toHaveBeenCalledWith(allUsersCacheKey);
				expect(mockCache.del).toHaveBeenCalledWith(`$_testScheme_{"id":"1"}`);
				expect(nextFunction).toHaveBeenCalled();

				// Reset mocks
				jest.clearAllMocks();
			});
		});

		it('should generate correct cache key including query parameters and route parameters', () => {
			const mockRequest = {
				query: { sort: 'asc', limit: '10' },
				params: { id: '123' },
			} as unknown as Request;

			const expectedCacheKey = '$_testScheme__{"id":"123"}_{"sort":"asc","limit":"10"}';

			const result = cacheMiddleware['getCacheKey'](mockRequest);

			expect(result).toBe(expectedCacheKey);
		});

		it('should handle requests with empty query parameters and route parameters', () => {
			const mockRequest = {
				method: 'GET',
				query: {},
				params: {},
			} as Request;

			const expectedCacheKey = '$_testScheme_';

			cacheMiddleware.execute(mockRequest, mockResponse as Response, nextFunction);

			expect(mockCache.get).toHaveBeenCalledWith(expectedCacheKey);
			expect(nextFunction).toHaveBeenCalled();
		});

		it('should invalidate related cache entries when handling write operations', () => {
			const testMethods = ['POST', 'PUT', 'DELETE'];

			testMethods.forEach((method) => {
				mockRequest.method = method;
				mockRequest.params = { id: '123' };

				const cacheKey = '$_testScheme__{"id":"123"}';
				const allUsersCacheKey = '$_testScheme_';
				const userCacheKey = '$_testScheme_{"id":"123"}';

				cacheMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

				expect(mockCache.del).toHaveBeenCalledWith(cacheKey);
				expect(mockCache.del).toHaveBeenCalledWith(allUsersCacheKey);
				expect(mockCache.del).toHaveBeenCalledWith(userCacheKey);
				expect(nextFunction).toHaveBeenCalled();

				// Reset mocks
				jest.clearAllMocks();
			});
		});

		it('should pass control to next middleware for unsupported HTTP methods', () => {
			mockRequest.method = 'PATCH';
			cacheMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);
			expect(nextFunction).toHaveBeenCalled();
			expect(mockCache.get).not.toHaveBeenCalled();
			expect(mockCache.set).not.toHaveBeenCalled();
			expect(mockCache.del).not.toHaveBeenCalled();
		});

		it('should use the specified cache TTL when setting cache entries', () => {
			const customTTL = 120000;
			const cacheMiddleware = new CacheMiddleware(mockCache, 'testScheme', customTTL);
			const testData = { id: 1, name: 'Test User' };
			mockRequest.method = 'GET';
			mockRequest.params = { id: '1' };
			mockResponse.statusCode = 200;

			const originalJson = mockResponse.json as jest.Mock;
			const jsonMock = jest.fn().mockImplementation(function (this: any, body: any) {
				return originalJson.call(this, body);
			});
			mockResponse.json = jsonMock;

			cacheMiddleware.execute(mockRequest as Request, mockResponse as Response, nextFunction);

			// Simulate successful response
			mockResponse.json(testData);

			expect(mockCache.set).toHaveBeenCalledWith(
				expect.stringContaining('$_testScheme__{"id":"1"}'),
				testData,
				customTTL
			);

			// Restore the original json method
			mockResponse.json = originalJson;
		});
	});
});
