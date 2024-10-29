import { NextFunction, Request, Response } from 'express';
import { injectable } from 'inversify';
import NodeCache from 'node-cache';
import 'reflect-metadata';
import { IMiddleware } from '../../common/middleware.interface';

enum HttpMethod {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE',
}

@injectable()
export class CacheMiddleware implements IMiddleware {
	private scheme: string;
	private cacheTTL: number;
	constructor(private cache: NodeCache, scheme: string, cacheTTL: number = 60000) {
		this.scheme = scheme;
		this.cacheTTL = cacheTTL;
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
		const cacheKey = this.getCacheKey(req);

		switch (req.method) {
			case 'GET':
				this.handleGet(cacheKey, req, res, next);
				break;
			case 'POST':
			case 'PUT':
			case 'DELETE':
				this.handleWrite(cacheKey, req, res, next);
				break;
			default:
				next();
				break;
		}
	}

	private getCacheKey(req: Request): string {
		const queryString = Object.keys(req.query).length ? `_${JSON.stringify(req.query)}` : '';
		const paramsString = Object.keys(req.params).length ? `_${JSON.stringify(req.params)}` : '';

		return `$_${this.scheme}_${paramsString}${queryString}`;
	}
	private handleGet(cacheKey: string, req: Request, res: Response, next: NextFunction) {
		const cachedData = this.cache.get(cacheKey);
		if (cachedData) {
			return res.json(cachedData);
		}
		this.cacheResponse(cacheKey, res);
		next();
	}

	private handleWrite(cacheKey: string, req: Request, res: Response, next: NextFunction) {
		this.invalidateRelatedCache(req);
		next();
	}

	private cacheResponse(cacheKey: string, res: Response) {
		const originalJson = res.json;

		res.json = (body: any) => {
			// Check if the response is successful (status code 2xx)
			if (res.statusCode >= 200 && res.statusCode < 300 && !body.error) {
				this.cache.set(cacheKey, body, this.cacheTTL);
			}
			return originalJson.call(res, body);
		};
	}

	private invalidateRelatedCache(req: Request) {
		const currentCacheKey = this.getCacheKey(req);
		this.cache.del(currentCacheKey);
		const allUsersCacheKey = `$_${this.scheme}_`;
		this.cache.del(allUsersCacheKey);
		if (req.params.id) {
			const userCacheKey = `$_${this.scheme}_{"id":"${req.params.id}"}`;
			this.cache.del(userCacheKey);
		}
	}
}
