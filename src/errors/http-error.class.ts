import axios, { AxiosError } from 'axios';

type ErrorType = AxiosError | number | unknown;

/**
 * Represents an HTTP error with additional context and status code information.
 * This class extends the built-in Error class to provide more specific error handling for HTTP requests.
 */
export class HTTPError extends Error {
	/** The HTTP status code associated with the error. */
	statusCode: number;

	/** Optional context information about where the error occurred. */
	context?: string;

	/**
	 * Creates a new HTTPError instance.
	 *
	 * @param error - The original error or status code. Can be an AxiosError, a number (HTTP status code), or any other type of error.
	 * @param context - Optional. Additional context information about where the error occurred.
	 * @param message - Optional. A custom error message. If not provided, a default message will be used based on the error type.
	 */
	constructor(error: ErrorType, context?: string, message?: string) {
		if (typeof error === 'number') {
			super(message);
			this.statusCode = error;
			this.message = message || 'An unknown error occurred';
			this.context = context;
		} else if (axios.isAxiosError(error)) {
			super(error.message);
			this.statusCode = error.response?.status || 500;
			this.message = error.response?.data?.message || error.message;
			this.context = context;
		} else {
			super(message);
			this.statusCode = 500;
			this.message = message || 'An unknown error occurred';
			this.context = context;
		}
	}
}
