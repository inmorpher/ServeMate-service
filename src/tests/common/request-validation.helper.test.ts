import {
    getValidatedBody,
    getValidatedData,
    getValidatedParams,
    getValidatedQuery,
} from '../../common/request-validation.helper';
import { createMockRequest } from '../helpers/http-test-utils';

describe('request validation helpers', () => {
	it('returns validated body when present', () => {
		const req = createMockRequest({
			body: { raw: true },
			validated: { body: { id: 1, name: 'validated' } },
		} as any);

		expect(getValidatedBody(req as any)).toEqual({ id: 1, name: 'validated' });
	});

	it('falls back to the raw request body when no validated data exists', () => {
		const req = createMockRequest({ body: { raw: true } });

		expect(getValidatedBody(req as any)).toEqual({ raw: true });
	});

	it('returns validated query and params values', () => {
		const req = createMockRequest({
			query: { raw: true },
			params: { raw: true },
			validated: {
				query: { page: 2 },
				params: { id: 10 },
			},
		} as any);

		expect(getValidatedQuery(req as any)).toEqual({ page: 2 });
		expect(getValidatedParams(req as any)).toEqual({ id: 10 });
	});

	it('falls back through getValidatedData for missing validated fields', () => {
		const req = createMockRequest({
			body: { rawBody: true },
			query: { rawQuery: true },
			params: { rawParams: true },
		} as any);

		expect(getValidatedData(req as any, 'body')).toEqual({ rawBody: true });
		expect(getValidatedData(req as any, 'query')).toEqual({ rawQuery: true });
		expect(getValidatedData(req as any, 'params')).toEqual({ rawParams: true });
	});
});