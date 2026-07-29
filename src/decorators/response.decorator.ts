






import 'reflect-metadata';
import z from 'zod';

export const RESPONSE_METADATA_KEY = 'response';

export interface ResponseMetadata {
	status: number| 'default';
	schema?: z.ZodTypeAny;
	description?: string;
}


export function ApiResponse(schema: z.ZodTypeAny, status = 200, description = 'Successful response') {


	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const existing: ResponseMetadata[] = Reflect.getMetadata(RESPONSE_METADATA_KEY, target, propertyKey) || [];
		existing.push({ status, schema, description });
		Reflect.defineMetadata(RESPONSE_METADATA_KEY, existing, target, propertyKey);
		return descriptor;
	}
}