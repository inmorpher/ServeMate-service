import { BaseService } from '../common/base.service';

/**
 * A decorator function that caches the result of the decorated method for a specified time.
 *
 * @param {number} ttl - The time-to-live of the cache entry in seconds.
 * @param {(...args: any[]) => string} getCacheKey - A function that takes the same arguments as the decorated method and returns a cache key.
 * @returns {MethodDecorator} - The method decorator that caches the result of the decorated method.
 *
 * @throws {Error} - Throws an error if the decorated method is not part of a service extending `BaseService`.
 *
 * @example
 * ```typescript
 * class MyService extends BaseService {
 *   @Cache(60, (id: number) => `user_${id}`)
 *   async getUser(id: number): Promise<User> {
 *     // method implementation
 *   }
 * }
 * ```
 */
export function Cache(ttl: number = 60, getCacheKey?: (...args: any[]) => string) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (this: BaseService, ...args: any[]) {
			if (!(this instanceof BaseService)) {
				throw new Error('Cache decorator can only be used on Services extending BaseService');
			}

			const key = getCacheKey ? getCacheKey(...args) : `${propertyKey}_${JSON.stringify(args)}`;
			console.log('key:', key);
			const cachedResult = this.cache.get(key);
			let count = 0;

			if (count === 0) {
				console.log('cachedResult:', !!cachedResult);
			}
			if (!!cachedResult) {
				count++;
			}

			if (cachedResult) {
				return cachedResult;
			}

			const result = await originalMethod.apply(this, args);
			this.cache.set(key, result, ttl);
			return result;
		};
	};
}

/**
 * A decorator function that invalidates cache entries by keys before executing the original method.
 *
 * @param getCacheKeys - A function that takes the same arguments as the decorated method and returns an array of cache keys to invalidate.
 *
 * @returns A method decorator that invalidates the specified cache keys and then calls the original method.
 *
 * @throws {Error} If the decorated method is not part of a class that extends `BaseService`.
 *
 * @example
 * ```typescript
 * class MyService extends BaseService {
 *   @InvalidateCacheByKeys((id: number) => [`user_$[{id}]`])
 *   async updateUser(id: number, data: UserData): Promise<void> {
 *     // method implementation
 *   }
 * }
 * ```
 */
export function InvalidateCacheByKeys(getCacheKeys: (...args: any[]) => string[]) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (this: BaseService, ...args: any[]) {
			if (!(this instanceof BaseService)) {
				throw new Error('Cache decorator can only be used on Services extending BaseService');
			}
			const keys = getCacheKeys(...args);
			console.log('keys to invalidate:', keys);
			keys.forEach((key) => {
				this.cache.del(key);
			});

			return await originalMethod.apply(this, args);
		};

		return descriptor;
	};
}

/**
 * A decorator function that invalidates cache entries by a given prefix.
 * This decorator can only be used on methods of services extending `BaseService`.
 *
 * @param {string} prefix - The prefix used to identify cache keys to invalidate.
 * @returns {MethodDecorator} - The method decorator that invalidates cache entries.
 *
 * @throws {Error} - Throws an error if the decorated method is not part of a service extending `BaseService`.
 *
 * @example
 * ```typescript
 * class MyService extends BaseService {
 *   @InvalidateCacheByPrefix('myPrefix')
 *   async myMethod() {
 *     // method implementation
 *   }
 * }
 * ```
 */
export function InvalidateCacheByPrefix(prefix: string) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (this: BaseService, ...args: any[]) {
			if (!(this instanceof BaseService)) {
				throw new Error('Cache decorator can only be used on Services extending BaseService');
			}
			const keys = this.cache.keys();
			console.log('keys:', keys);
			const keysToDelete = keys.filter((key) => key.startsWith(prefix));
			console.log('keysToDelete:', keysToDelete);
			keysToDelete.forEach((key) => {
				this.cache.del(key);
			});

			return await originalMethod.apply(this, args);
		};

		return descriptor;
	};
}
