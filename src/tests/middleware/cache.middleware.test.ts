import '../helpers/mock-dto-package';
import '../helpers/mock-inversify';

import NodeCache from 'node-cache';
import { CacheMiddleware } from '../../middleware/cache/cache.middleware';
import { createMockNext, createMockRequest, createMockResponse } from '../helpers/http-test-utils';

describe('CacheMiddleware', () => {
	it('serves cached GET responses when the cache contains a value', () => {
		const cache = {
			get: jest.fn().mockReturnValue({ data: 'cached' }),
			set: jest.fn(),
			del: jest.fn(),
		} as unknown as NodeCache;
		const middleware = new CacheMiddleware(cache, 'users', 60000);
		const req = createMockRequest({ method: 'GET', query: { page: '1' } });
		const res = createMockResponse();
		const next = createMockNext();

		middleware.execute(req, res, next);

		expect(cache.get).toHaveBeenCalledWith('$_users__{"page":"1"}');
		expect(res.json).toHaveBeenCalledWith({ data: 'cached' });
		expect(next).not.toHaveBeenCalled();
	});

	it('wraps GET responses and stores successful payloads in the cache', () => {
		const cache = {
			get: jest.fn().mockReturnValue(undefined),
			set: jest.fn(),
			del: jest.fn(),
		} as unknown as NodeCache;
		const middleware = new CacheMiddleware(cache, 'users', 60000);
		const req = createMockRequest({ method: 'GET', query: { page: '2' } });
		const res = createMockResponse();
		const next = createMockNext();

		middleware.execute(req, res, next);
		res.status(200);
		res.json({ data: 'fresh' });

		expect(cache.set).toHaveBeenCalledWith('$_users__{"page":"2"}', { data: 'fresh' }, 60000);
		expect(next).toHaveBeenCalledTimes(1);
	});

	it('invalidates the related cache entries for writes', () => {
		const cache = {
			get: jest.fn(),
			set: jest.fn(),
			del: jest.fn(),
		} as unknown as NodeCache;
		const middleware = new CacheMiddleware(cache, 'users', 60000);
		const req = createMockRequest({ method: 'POST', params: { id: '7' } });
		const res = createMockResponse();
		const next = createMockNext();

		middleware.execute(req, res, next);

		expect(cache.del).toHaveBeenCalledWith('$_users__{"id":"7"}');
		expect(cache.del).toHaveBeenCalledWith('$_users_');
		expect(cache.del).toHaveBeenCalledWith('$_users_{"id":"7"}');
		expect(next).toHaveBeenCalledTimes(1);
	});
});