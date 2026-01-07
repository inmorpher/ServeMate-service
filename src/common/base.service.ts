import { Prisma, PrismaClient } from '@prisma/client';
import { injectable } from 'inversify';
import NodeCache from 'node-cache';
import { HTTPError } from '../errors/http-error.class';

export type PrismaTransaction = Omit<
	PrismaClient,
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
interface RangeFilter {
	gte?: number | Date;
	lte?: number | Date;
}

interface NumberRangeFilter {
	gte?: number;
	lte?: number;
}

interface DateRangeFilter {
	gte?: Date;
	lte?: Date;
}

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
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
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
			'maxAmount',
			'minAmount',
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

			// Process array and skip empty arrays
			if (Array.isArray(value)) {
				let filtered = value;
				if (value.length && typeof value[0] === 'string') {
					filtered = value.filter((item) => item.trim() !== '');
				}
				if (filtered.length === 0) {
					return [];
				}
				return { ...acc, [key]: { hasSome: filtered } };
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

	/**
	 * Builds a Prisma-compatible `where` filter for fields that are arrays, assigning a `hasEvery` condition.
	 *
	 * @param key - The key of the field to filter on.
	 * @param value - The value(s) to match against the array field. Should be an array.
	 * @param whereInput - The object to which the filter condition will be added.
	 * @param transformValue - Optional function to transform each value before adding it to the filter.
	 *
	 * @remarks
	 * This method modifies the `whereInput` object in place. If `value` is an array, it sets a `hasEvery` filter
	 * on the specified `key`, optionally transforming each value using `transformValue`.
	 */
	protected buildWhereForArrayField(
		key: string,
		value: any,
		whereInput: any,
		transformValue?: (value: any) => any
	): void {
		if (Array.isArray(value)) {
			whereInput[key] = {
				hasEvery: transformValue ? value.map(transformValue) : value,
			};
		}
	}

	/**
	 * Constructs a range filter object based on optional minimum and maximum values.
	 *
	 * @param min - The minimum value for the range filter (inclusive). Can be a number or a Date. If undefined, no lower bound is applied.
	 * @param max - The maximum value for the range filter (inclusive). Can be a number or a Date. If undefined, no upper bound is applied.
	 * @returns A `RangeFilter` object with `gte` (greater than or equal) and/or `lte` (less than or equal) properties set,
	 *          or `undefined` if both `min` and `max` are undefined.
	 */
	protected buildRangeWhere<T extends number | Date>(
		min?: T,
		max?: T
	): (T extends number ? NumberRangeFilter : DateRangeFilter) | undefined {
		if (min === undefined && max === undefined) {
			return undefined;
		}

		const filter: any = {};
		if (min !== undefined) {
			filter.gte = min;
		}
		if (max !== undefined) {
			filter.lte = max;
		}
		return filter;
	}
}
