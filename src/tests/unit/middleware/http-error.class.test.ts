import { AxiosError } from 'axios';
import { HTTPError } from '../../../errors/http-error.class';

// jest.mock('axios');

describe('HTTPError', () => {
	it('should create an HTTPError instance with a numeric status code', () => {
		const errorCode = 403;
		const context = 'Authorization';
		const message = 'Access Forbidden';

		const httpError = new HTTPError(errorCode, context, message);

		expect(httpError).toBeInstanceOf(HTTPError);
		expect(httpError).toBeInstanceOf(Error);
		expect(httpError.statusCode).toBe(errorCode);
		expect(httpError.context).toBe(context);
		expect(httpError.message).toBe(message);
	});

	it('should create an HTTPError instance with a custom message and numeric status code', () => {
		const errorCode = 418;
		const context = 'Teapot';
		const message = "I'm a teapot";

		const httpError = new HTTPError(errorCode, context, message);

		expect(httpError).toBeInstanceOf(HTTPError);
		expect(httpError).toBeInstanceOf(Error);
		expect(httpError.statusCode).toBe(errorCode);
		expect(httpError.context).toBe(context);
		expect(httpError.message).toBe(message);
	});

	it('should create an HTTPError instance with an AxiosError that has a response with status and data', () => {
		const axiosError = new AxiosError('Network error', '422', undefined, undefined, {
			status: 422,
			data: { message: 'Unprocessable Entity' },
			statusText: 'Unprocessable Entity',
			headers: {},
			config: {} as any,
		});

		const context = 'API request';

		const httpError = new HTTPError(axiosError, context);

		expect(httpError).toBeInstanceOf(HTTPError);
		expect(httpError).toBeInstanceOf(Error);
		expect(httpError.statusCode).toBe(422);
		expect(httpError.context).toBe(context);
		expect(httpError.message).toBe('Unprocessable Entity');
	});

	it('should create an HTTPError instance with an AxiosError that has a response with status but no data', () => {
		const axiosError = new AxiosError('Network error', '503', undefined, undefined, {
			status: 503,
		} as any);
		const context = 'Service Unavailable';

		const httpError = new HTTPError(axiosError, context);

		expect(httpError).toBeInstanceOf(HTTPError);
		expect(httpError).toBeInstanceOf(Error);
		expect(httpError.statusCode).toBe(503);
		expect(httpError.context).toBe(context);
		expect(httpError.message).toBe('Network error');
	});

	it('should create an HTTPError instance with an unknown error type', () => {
		const unknownError = { some: 'unknown error' };
		const context = 'Unknown Error Context';
		const message = 'An unknown error occurred';

		const httpError = new HTTPError(unknownError, context, message);

		expect(httpError).toBeInstanceOf(HTTPError);
		expect(httpError).toBeInstanceOf(Error);
		expect(httpError.statusCode).toBe(500);
		expect(httpError.context).toBe(context);
		expect(httpError.message).toBe(message);
	});

	it('should create an HTTPError instance with an unknown error type and custom message', () => {
		const unknownError = { some: 'unknown error' };
		const context = 'Unknown Error Context';
		const message = 'A custom error message';

		const httpError = new HTTPError(unknownError, context, message);

		expect(httpError).toBeInstanceOf(HTTPError);
		expect(httpError).toBeInstanceOf(Error);
		expect(httpError.statusCode).toBe(500);
		expect(httpError.context).toBe(context);
		expect(httpError.message).toBe(message);
	});

	it('should create an HTTPError instance with a numeric status code and no context', () => {
		const errorCode = 404;
		const httpError = new HTTPError(errorCode);

		expect(httpError).toBeInstanceOf(HTTPError);
		expect(httpError).toBeInstanceOf(Error);
		expect(httpError.statusCode).toBe(errorCode);
		expect(httpError.context).toBeUndefined();
		expect(httpError.message).toBe('An unknown error occurred');
	});

	it('should create an HTTPError instance with an AxiosError and no context', () => {
		const axiosError = new AxiosError('Request failed', '500', undefined, undefined, {
			status: 500,
			data: { message: 'Internal Server Error' },
			statusText: 'Internal Server Error',
			headers: {},
			config: {} as any,
		});

		const httpError = new HTTPError(axiosError);

		expect(httpError).toBeInstanceOf(HTTPError);
		expect(httpError).toBeInstanceOf(Error);
		expect(httpError.statusCode).toBe(500);
		expect(httpError.context).toBeUndefined();
		expect(httpError.message).toBe('Internal Server Error');
	});

	it('should create an HTTPError instance with a non-AxiosError object', () => {
		const nonAxiosError = { some: 'error' };
		const context = 'Non-Axios Error Context';
		const message = 'A non-Axios error occurred';

		const httpError = new HTTPError(nonAxiosError, context, message);

		expect(httpError).toBeInstanceOf(HTTPError);
		expect(httpError).toBeInstanceOf(Error);
		expect(httpError.statusCode).toBe(500);
		expect(httpError.context).toBe(context);
		expect(httpError.message).toBe(message);
	});

	it('should create an HTTPError instance with a string error', () => {
		const stringError = 'A string error occurred';
		const context = 'String Error Context';
		const message = 'A custom string error message';

		const httpError = new HTTPError(stringError, context, message);

		expect(httpError).toBeInstanceOf(HTTPError);
		expect(httpError).toBeInstanceOf(Error);
		expect(httpError.statusCode).toBe(500);
		expect(httpError.context).toBe(context);
		expect(httpError.message).toBe(message);
	});
});
