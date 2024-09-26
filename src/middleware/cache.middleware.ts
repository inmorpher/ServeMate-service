import { NextFunction, Request, Response } from 'express';
import { injectable } from 'inversify';
import NodeCache from 'node-cache';
import { IMiddleware } from '../common/middleware.interface';

@injectable()
export class CacheMiddleware implements IMiddleware {
	private cache: NodeCache;

	constructor(cache: NodeCache) {
		this.cache = cache;
	}

	/**
	 * Executes the caching middleware.
	 * This function checks if the requested data is in the cache. If it is, it returns the cached data.
	 * If not, it modifies the response object to cache the data before sending it.
	 *
	 * @param req - The Express request object.
	 * @param res - The Express response object.
	 * @param next - The Express next function to pass control to the next middleware.
	 * @returns void - This function doesn't return anything directly, but may send a response if cached data is found.
	 */
	execute(req: Request, res: Response, next: NextFunction) {
		const cacheKey = `users_${req.url}`;
		const cachedData = this.cache.get(cacheKey);
		if (cachedData) {
			return res.json(cachedData);
		}
		(res as any).originalJson = res.json;
		res.json = (body) => {
			this.cache.set(cacheKey, body, 60000); // Cache for 1 minute
			return (res as any).originalJson(body);
		};
		next();
	}
}
