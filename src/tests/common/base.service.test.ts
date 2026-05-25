import '../helpers/mock-inversify';

import { BaseService } from '../../common/base.service';
import { HTTPError } from '../../errors/http-error.class';

class TestService extends BaseService {
	protected serviceName = 'TestService';

	public where(criteria: Record<string, unknown>) {
		return this.buildWhere(criteria);
	}

	public range(min?: number, max?: number) {
		return this.buildRangeWhere(min, max);
	}

	public arrayField(key: string, value: unknown, whereInput: Record<string, unknown>, transform?: (value: unknown) => unknown) {
		this.buildWhereForArrayField(key, value, whereInput, transform);
	}

	public mapError(error: unknown) {
		return this.handleError(error);
	}

	public cacheSnapshot() {
		return this.cache;
	}
}

describe('BaseService', () => {
	it('builds normalized where clauses', () => {
		const service = new TestService();

		expect(
			service.where({
				id: '7',
				name: 'Alice',
				role: 'ADMIN',
				tags: ['one', '', 'two'],
				page: 2,
				serverName: 'ignored',
				nullable: null,
			})
		).toEqual({
			id: 7,
			name: 'Alice',
			role: { equals: 'ADMIN' },
			tags: { hasSome: ['one', 'two'] },
		});
	});

	it('builds array and range filters and exposes the cache', () => {
		const service = new TestService();
		const whereInput: Record<string, unknown> = {};

		service.arrayField('ids', ['1', '2'], whereInput, Number);
		expect(whereInput).toEqual({ ids: { hasEvery: [1, 2] } });
		expect(service.range()).toBeUndefined();
		expect(service.range(1, 5)).toEqual({ gte: 1, lte: 5 });

		service.cacheSnapshot().set('key', 'value');
		service.clearCache();
		expect(service.cacheSnapshot().get('key')).toBeUndefined();
	});

	it('maps errors into HTTPError instances', () => {
		const service = new TestService();
		const passthrough = service.mapError(new HTTPError(404, 'Other', 'Missing', '/path'));
		expect(passthrough).toMatchObject({
			statusCode: 404,
			context: 'TestService',
			message: 'Missing',
			path: '/path',
		});

		const generic = service.mapError(new Error('boom'));
		expect(generic).toMatchObject({
			statusCode: 500,
			context: 'TestService',
			message: 'An unexpected error occurred',
			path: 'boom',
		});
	});
});