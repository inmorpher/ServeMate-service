import fs from 'fs';
import {
  OpenAPIObject,
  OperationObject,
  ParameterObject,
  PathItemObject,
  SecuritySchemeObject,
} from 'openapi3-ts/oas31';
import path from 'path';
import { z } from 'zod';
import { METADATA_KEYS, RouteDefinition } from '../decorators/httpDecorators';
import { RESPONSE_METADATA_KEY, ResponseMetadata } from '../decorators/response.decorator';
import { zodToOpenApiSchema } from './dto-to-openapi';

function isZodSchema(value: unknown): value is z.ZodTypeAny {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    value !== null &&
    'parse' in value &&
    'safeParse' in value &&
    '_def' in value
  );
}

function loadDtoSchemas() {
  const dtoModule = require('../dto-package/src/dto') as Record<string, unknown>;

  return Object.fromEntries(
    Object.entries(dtoModule).filter(([, value]) => isZodSchema(value)),
  ) as Record<string, z.ZodTypeAny>;
}

function getControllerFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return getControllerFiles(fullPath);
      }

      return entry.isFile() && /\.controller\.(ts|js)$/.test(entry.name) ? [fullPath] : [];
    });
}

function joinRoutePath(prefix: string, routePath: string): string {
  const normalizedPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;
  const normalizedRoute =
    routePath && routePath !== '/'
      ? routePath.startsWith('/')
        ? routePath
        : `/${routePath}`
      : '';
  return `${normalizedPrefix}${normalizedRoute}` || '/';
}

function buildParameters(schema: z.ZodTypeAny, location: 'query' | 'params'): ParameterObject[] {
  const openApiLocation = location === 'params' ? 'path' : 'query';
  const typeName = (schema._def as any).typeName as string;

  if (typeName === 'ZodObject') {
    const shape = (schema as z.ZodObject<any>).shape;
    return Object.entries(shape).map(([name, fieldSchema]) => ({
      name,
      in: openApiLocation,
      required: location === 'params',
      schema: zodToOpenApiSchema(fieldSchema as z.ZodTypeAny),
    }));
  }

  return [
    {
      name: 'value',
      in: openApiLocation,
      required: location === 'params',
      schema: zodToOpenApiSchema(schema),
    },
  ];
}

function buildResponseContent(meta: ResponseMetadata): Record<string, unknown> {
  if (!meta.schema) {
    return {};
  }
  return {
    content: {
      'application/json': {
        schema: zodToOpenApiSchema(meta.schema),
      },
    },
  };
}

function buildResponses(value: any, handlerName: string): Record<string, unknown> {
  const responseMetas: ResponseMetadata[] =
    Reflect.getMetadata(RESPONSE_METADATA_KEY, value.prototype, handlerName) || [];

  if (!responseMetas.length) {
    return {
      '200': {
        description: 'Successful response',
      },
    };
  }

  const responses: Record<string, unknown> = {};
  responseMetas.forEach((meta) => {
    const status = typeof meta.status === 'number' ? String(meta.status) : meta.status;
    responses[status] = {
      description: meta.description ?? 'Successful response',
      ...buildResponseContent(meta),
    };
  });

  return responses;
}

function loadControllerRoutes(): Record<string, PathItemObject> {
  const controllersDir = path.resolve(__dirname, '../controllers');
  const controllerFiles = getControllerFiles(controllersDir);
  const paths: Record<string, PathItemObject> = {};

  controllerFiles.forEach((controllerFile) => {
    const controllerModule = require(controllerFile) as Record<string, unknown>;

    Object.values(controllerModule).forEach((value) => {
      if (typeof value !== 'function') {
        return;
      }

      const prefix = Reflect.getMetadata(METADATA_KEYS.PREFIX, value);
      const routes: RouteDefinition[] = Reflect.getMetadata(METADATA_KEYS.ROUTES, value) || [];

      if (!prefix || !routes?.length) {
        return;
      }

      routes.forEach((route) => {
        const pathKey = `/api${joinRoutePath(prefix, route.path)}`;
        const operation: OperationObject = {
          summary: route.handlerName,
          operationId: `${value.name}_${route.handlerName}`,
          tags: [value.name.replace(/Controller$/, '')],
          responses: buildResponses(value, route.handlerName),
        };

        const validationMetadata = Reflect.getMetadata('validate', value.prototype, route.handlerName);
        if (validationMetadata?.schema) {
          if (validationMetadata.property === 'body') {
            operation.requestBody = {
              required: true,
              content: {
                'application/json': {
                  schema: zodToOpenApiSchema(validationMetadata.schema),
                },
              },
            };
          } else {
            operation.parameters = buildParameters(validationMetadata.schema, validationMetadata.property);
          }
        }

        if (!paths[pathKey]) {
          paths[pathKey] = {};
        }

        (paths[pathKey] as Record<string, unknown>)[route.method] = operation;
      });
    });
  });

  return paths;
}

const NAMED_SCHEMAS = [
  'UserSchema',
  'UserLoginSchema',
  'CreateUserSchema',
  'UpdateUserSchema',
  'UserParamSchema',
  'drinkItemSchema',
  'foodItemSchema',
  'createDrinkItemSchema',
  'createFoodItemSchema',
  'updateDrinkItemSchema',
  'updateFoodItemSchema',
  'searchDrinkItemsSchema',
  'searchFoodItemsSchema',
  'drinkItemsListSchema',
  'foodItemsListSchema',
  'OrderSchema',
  'OrderSearchSchema',
  'OrderCreateSchema',
  'OrderFullSingleSchema',
  'OrderUpdateProps',
  'OrderUpdateItemsSchema',
  'OrderMeta',
  'PaymentSchema',
  'PaymentSearchSchema',
  'RefundSchema',
  'ReservationSchema',
  'CreateReservationSchema',
  'UpdateReservationSchema',
  'ReservationWithTablesSchema',
  'ReservationDetailedSchema',
  'ReservationSearchCriteria',
  'TableBaseTableSchema',
  'TableSchema',
  'TableSearchCriteriaSchema',
  'TableCreateSchema',
  'TableUpdatesSchema',
  'TableIdSchema',
  'TableAssignmentSchema',
  'TableSeatingSchema',
];

export function buildOpenApiFromDto(): OpenAPIObject {
  const dtoSchemas = loadDtoSchemas();

  const schemas: Record<string, unknown> = {};
  NAMED_SCHEMAS.forEach((name) => {
    const schema = dtoSchemas[name];
    if (schema) {
      schemas[name] = zodToOpenApiSchema(schema);
    }
  });

  return {
    openapi: '3.1.0',
    info: {
      title: 'ServeMate API',
      version: '1.0.0',
      description: 'Auto-generated OpenAPI from DTO/Zod schemas',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local development server' }],
    paths: loadControllerRoutes(),
    components: {
      schemas,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        } as SecuritySchemeObject,
      },
    } as OpenAPIObject['components'],
  };
}