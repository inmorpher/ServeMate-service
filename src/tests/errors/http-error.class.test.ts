import { AxiosError } from 'axios';
import { HTTPError } from '../../errors/http-error.class';

describe('HTTPError', () => {
	it('uses the provided status code when constructed from a number', () => {
		const error = new HTTPError(403, 'Auth', 'Forbidden', '/auth/login');

		expect(error.statusCode).toBe(403);
		expect(error.message).toBe('Forbidden');
		expect(error.context).toBe('Auth');
		expect(error.path).toBe('/auth/login');
	});

	it('extracts status and message from axios errors', () => {
		const axiosError = {
			isAxiosError: true,
			message: 'Request failed',
			response: {
				status: 502,
				data: {
					message: 'Upstream service failed',
				},
			},
		} as AxiosError;

		const error = new HTTPError(axiosError, 'Gateway', undefined, '/proxy');

		expect(error.statusCode).toBe(502);
		expect(error.message).toBe('Upstream service failed');
		expect(error.context).toBe('Gateway');
		expect(error.path).toBe('/proxy');
	});

	it('falls back to a generic 500 error for unknown values', () => {
		const error = new HTTPError(new Error('boom'), 'Service');

		expect(error.statusCode).toBe(500);
		expect(error.message).toBe('An unknown error occurred');
		expect(error.context).toBe('Service');
	});
});