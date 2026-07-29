import { OpenAPIObject } from 'openapi3-ts/oas31';
import { buildOpenApiFromDto } from './build-openapi-from-dto';

export const openApiDocument: OpenAPIObject = buildOpenApiFromDto();
