import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { injectable } from 'inversify';
import NodeCache from 'node-cache';
import { HTTPError } from '../errors/http-error.class';

@injectable()
export class BaseService {
	protected defaultPage = 1;
	protected defaultPageSize = 10;
	protected defaultSortOrder: 'asc' | 'desc' = 'asc';
	protected defaultSortBy: string = 'id';
	protected serviceName: string = 'Service class';
	protected _cache: NodeCache;

	constructor() {
		this._cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
	}
	/**
	 * Handles various types of errors and converts them into HTTPError instances.
	 * This method specifically deals with Prisma database errors, existing HTTPErrors,
	 * and unexpected errors, providing appropriate status codes and error messages.
	 *
	 * @param error - The error to be handled. Can be of any type.
	 * @param serviceName - The name of the service where the error occurred.
	 * @returns An HTTPError instance with appropriate status code, service name, and error message.
	 */

	protected get cache(): NodeCache {
		return this._cache;
	}

	protected set cache(cache: NodeCache) {
		this._cache = cache;
	}

	protected handleError(error: unknown): HTTPError {
		if (error instanceof PrismaClientKnownRequestError) {
			const baseMessage = 'Database operation failed';
			switch (error.code) {
				case 'P2002':
					return new HTTPError(
						409,
						this.serviceName,
						'Unique constraint violation',
						`${baseMessage}: ${error.message}`
					);
				case 'P2025':
					return new HTTPError(
						404,
						this.serviceName,
						'Record not found',
						`${baseMessage}: ${error.message}`
					);
				case 'P2014':
				case 'P2022':
				case 'P2023':
					return new HTTPError(
						400,
						this.serviceName,
						'Invalid input data',
						`${baseMessage}: ${error.message}`
					);
				default:
					return new HTTPError(500, this.serviceName, baseMessage, error.message);
			}
		}

		if (error instanceof HTTPError) {
			return new HTTPError(error.statusCode, this.serviceName, error.message, error.path);
		}

		return new HTTPError(
			500,
			this.serviceName,
			'An unexpected error occurred',
			error instanceof Error ? error.message : String(error)
		);
	}

	clearCache() {
		this.cache.flushAll();
	}

	/**
	 * Builds a "where" clause object based on the provided criteria.
	 *
	 * @template TCriteria - The type of the criteria object.
	 * @template TWhere - The type of the resulting "where" clause object.
	 *
	 * @param {TCriteria} criteria - The criteria object containing key-value pairs to be converted into a "where" clause.
	 * @returns {TWhere} - The resulting "where" clause object.
	 *
	 * @remarks
	 * - Fields specified in `EXCLUDED_WHERE_FIELDS` are excluded from the resulting "where" clause.
	 * - Fields with `undefined` or `null` values are skipped.
	 * - Empty arrays are skipped.
	 * - Numeric values are converted to numbers.
	 * - String values are uppercased if they are already in uppercase.
	 * - Arrays are converted to a condition with `hasSome`.
	 */
	protected buildWhere<TCriteria extends Record<string, any>, TWhere>(criteria: TCriteria): TWhere {
		// Fields that should not be included in the where clause
		const EXCLUDED_WHERE_FIELDS = [
			'page',
			'pageSize',
			'sortBy',
			'sortOrder',
			'test',
			'serverName',
		] as const;

		const res = Object.entries(criteria).reduce((acc, [key, value]) => {
			// Skip fields that should not be included in the where clause
			if (EXCLUDED_WHERE_FIELDS.includes(key as any)) {
				return acc;
			}

			// Skip undefined and null values
			if (value === undefined || value === null) {
				return acc;
			}

			// Skip empty arrays
			if (Array.isArray(value)) {
				if (value.length === 0) {
					return acc;
				}
				return { ...acc, [key]: { hasSome: value } };
			}

			// Convert numbers to number type
			if (typeof value === 'number' || !isNaN(Number(value))) {
				return { ...acc, [key]: Number(value) };
			}

			//	Uppercase string values
			if (typeof value === 'string') {
				if (value === value.toUpperCase()) {
					return { ...acc, [key]: { equals: value } };
				}
				return { ...acc, [key]: value };
			}

			return { ...acc, [key]: value };
		}, {}) as TWhere;

		return res;
	}
}
