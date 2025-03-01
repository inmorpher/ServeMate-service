import NodeCache from 'node-cache';
import 'reflect-metadata';
import { BaseService } from '../../../common/base.service';
import { Cache, InvalidateCacheByKeys, InvalidateCacheByPrefix } from '../../../decorators/Cache';

const mockCache: Partial<NodeCache> = {
	get: jest.fn(),
	set: jest.fn(),
	del: jest.fn(),
	keys: jest.fn(),
	has: jest.fn(),
	flushAll: jest.fn(),
};

class MockService extends BaseService {
	public _cache: NodeCache;

	constructor() {
		super();
		this._cache = mockCache as NodeCache;
		this.fetchData = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
		this.updateData = jest.fn().mockResolvedValue(true);
	}

	get cache(): NodeCache {
		return this._cache;
	}

	async fetchData(id: number) {
		return { id, name: 'Test' };
	}

	async updateData(id: number, data: any) {
		return true;
	}

	@Cache(60, (id: number) => `data_${id}`)
	async getData(id: number) {
		return this.fetchData(id);
	}

	@Cache() // Test default TTL
	async getDataDefaultTTL(id: number) {
		return this.fetchData(id);
	}

	@Cache(60)
	async getDataWithoutKeyGen(id: number) {
		return this.fetchData(id);
	}

	@InvalidateCacheByKeys((id: number) => [`data_${id}`])
	async update(id: number, data: any) {
		return this.updateData(id, data);
	}

	@InvalidateCacheByPrefix('data_')
	async refresh() {
		return true;
	}
}

describe('Cache Decorators', () => {
	let service: MockService;

	beforeEach(() => {
		service = new MockService();
		jest.clearAllMocks();
	});

	describe('@Cache decorator', () => {
		test('should return cached result if available', async () => {
			const cachedData = { id: 1, name: 'Cached' };
			(service.cache.get as jest.Mock).mockReturnValue(cachedData);

			const result = await service.getData(1);

			expect(service.cache.get).toHaveBeenCalledWith('data_1');
			expect(result).toBe(cachedData);
			expect(service.fetchData).not.toHaveBeenCalled();
		});

		test('should cache result when not in cache', async () => {
			const fetchedData = { id: 1, name: 'Test' };
			(service.cache.get as jest.Mock).mockReturnValue(null);
			(service.fetchData as jest.Mock).mockResolvedValue(fetchedData);

			const result = await service.getData(1);

			expect(result).toEqual(fetchedData);
			expect(service.cache.set).toHaveBeenCalledWith('data_1', fetchedData, 60);
		});

		test('should use default cache key when no key generator provided', async () => {
			const fetchedData = { id: 1, name: 'Test' };
			(service.cache.get as jest.Mock).mockReturnValue(null);
			(service.fetchData as jest.Mock).mockResolvedValue(fetchedData);

			await service.getDataWithoutKeyGen(1);

			expect(service.cache.get).toHaveBeenCalledWith('getDataWithoutKeyGen_[1]');
		});

		test('should cache result with default TTL when not specified', async () => {
			const fetchedData = { id: 1, name: 'Test' };
			(service.cache.get as jest.Mock).mockReturnValue(null);
			(service.fetchData as jest.Mock).mockResolvedValue(fetchedData);

			await service.getDataDefaultTTL(1);

			expect(service.cache.set).toHaveBeenCalledWith('getDataDefaultTTL_[1]', fetchedData, 60);
		});

		test('should increment counter when cache hit occurs', async () => {
			const cachedData = { id: 1, name: 'Cached' };
			(service.cache.get as jest.Mock)
				.mockReturnValueOnce(cachedData)
				.mockReturnValueOnce(cachedData);

			await service.getData(1);
			await service.getData(1);

			expect(service.cache.get).toHaveBeenCalledTimes(2);
			expect(service.fetchData).not.toHaveBeenCalled();
		});
	});

	describe('@InvalidateCacheByKeys decorator', () => {
		test('should invalidate multiple specific keys', async () => {
			await service.update(1, { name: 'Updated' });

			expect(service.cache.del).toHaveBeenCalledWith('data_1');
			expect(service.updateData).toHaveBeenCalledWith(1, { name: 'Updated' });
		});

		test('should handle empty key array', async () => {
			class TestService extends BaseService {
				_cache = mockCache as NodeCache;

				@InvalidateCacheByKeys(() => [])
				async emptyKeys() {
					return true;
				}
			}

			const testService = new TestService();
			await testService.emptyKeys();

			expect(service.cache.del).not.toHaveBeenCalled();
		});

		test('should throw error if not used on BaseService', async () => {
			class InvalidService {
				@InvalidateCacheByKeys(() => ['key'])
				async update() {
					return true;
				}
			}

			const invalidService = new InvalidService();
			await expect(invalidService.update()).rejects.toThrow(
				'Cache decorator can only be used on Services extending BaseService'
			);
		});
	});

	describe('@InvalidateCacheByPrefix decorator', () => {
		test('should invalidate all keys with prefix', async () => {
			(service.cache.keys as jest.Mock).mockReturnValue(['data_1', 'data_2', 'other_1']);

			await service.refresh();

			expect(service.cache.keys).toHaveBeenCalled();
			expect(service.cache.del).toHaveBeenCalledWith('data_1');
			expect(service.cache.del).toHaveBeenCalledWith('data_2');
			expect(service.cache.del).not.toHaveBeenCalledWith('other_1');
		});

		test('should handle empty cache', async () => {
			(service.cache.keys as jest.Mock).mockReturnValue([]);

			await service.refresh();

			expect(service.cache.keys).toHaveBeenCalled();
			expect(service.cache.del).not.toHaveBeenCalled();
		});

		test('should throw error if not used on BaseService', async () => {
			class InvalidService {
				@InvalidateCacheByPrefix('test_')
				async refresh() {
					return true;
				}
			}

			const invalidService = new InvalidService();
			await expect(invalidService.refresh()).rejects.toThrow(
				'Cache decorator can only be used on Services extending BaseService'
			);
		});
	});

	describe('Error cases', () => {
		test('should throw error if Cache decorator not used on BaseService', async () => {
			class InvalidService {
				@Cache(60)
				async getData() {
					return true;
				}
			}

			const invalidService = new InvalidService();
			await expect(invalidService.getData()).rejects.toThrow(
				'Cache decorator can only be used on Services extending BaseService'
			);
		});
	});
});
