import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { injectable } from 'inversify';
import { HTTPError } from '../errors/http-error.class';

@injectable()
export abstract class BaseService {
	constructor() {}
	/**
	 * Handles various types of errors and converts them into HTTPError instances.
	 * This method specifically deals with Prisma database errors, existing HTTPErrors,
	 * and unexpected errors, providing appropriate status codes and error messages.
	 *
	 * @param error - The error to be handled. Can be of any type.
	 * @param serviceName - The name of the service where the error occurred.
	 * @returns An HTTPError instance with appropriate status code, service name, and error message.
	 */
	protected handleError(error: unknown, serviceName: string): HTTPError {
		if (error instanceof PrismaClientKnownRequestError) {
			const baseMessage = 'Database operation failed';
			switch (error.code) {
				case 'P2002':
					return new HTTPError(
						409,
						serviceName,
						'Unique constraint violation',
						`${baseMessage}: ${error.message}`
					);
				case 'P2025':
					return new HTTPError(
						404,
						serviceName,
						'Record not found',
						`${baseMessage}: ${error.message}`
					);
				case 'P2014':
				case 'P2022':
				case 'P2023':
					return new HTTPError(
						400,
						serviceName,
						'Invalid input data',
						`${baseMessage}: ${error.message}`
					);
				default:
					return new HTTPError(500, serviceName, baseMessage, error.message);
			}
		}

		if (error instanceof HTTPError) {
			return new HTTPError(error.statusCode, serviceName, error.message, error.path);
		}

		return new HTTPError(
			500,
			serviceName,
			'An unexpected error occurred',
			error instanceof Error ? error.message : String(error)
		);
	}
}
