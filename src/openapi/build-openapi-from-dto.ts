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
import {
  RESPONSE_METADATA_KEY,
  ResponseMetadata,
} from '../decorators/response.decorator';
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
  const dtoModules = [
    '../drink-items/dto',
    '../food-items/dto',
    '../orders/dto',
    '../payments/dto',
    '../reservations/dto',
    '../tables/dto',
    '../users/dto',
  ].map(modulePath => require(modulePath) as Record<string, unknown>);

  return Object.fromEntries(
    dtoModules
      .flatMap(dtoModule => Object.entries(dtoModule))
      .filter(([, value]) => isZodSchema(value))
  ) as Record<string, z.ZodTypeAny>;
}

function getControllerFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  if (path.basename(dir) === 'old') {
    return [];
  }

  if (
    path.basename(dir) === 'tables' &&
    path.basename(path.dirname(dir)) === 'controllers'
  ) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getControllerFiles(fullPath);
    }

    return entry.isFile() && /\.controller\.(ts|js)$/.test(entry.name)
      ? [fullPath]
      : [];
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
  return (
    `${normalizedPrefix}${normalizedRoute}`.replace(
      /:([A-Za-z0-9_]+)/g,
      '{$1}'
    ) || '/'
  );
}

function isProtectedPath(pathKey: string): boolean {
  return !(
    pathKey === '/api/auth/login' ||
    pathKey === '/api/auth/refresh-token' ||
    pathKey.includes('/meta')
  );
}

function getValidationMetadata(
  value: any,
  handlerName: string
): Array<{
  schema: z.ZodTypeAny;
  property: 'body' | 'params' | 'query';
}> {
  const validations = Reflect.getMetadata(
    'validations',
    value.prototype,
    handlerName
  );

  if (validations?.length) {
    return validations;
  }

  const validation = Reflect.getMetadata(
    'validate',
    value.prototype,
    handlerName
  );
  return validation ? [validation] : [];
}

function buildParameters(
  schema: z.ZodTypeAny,
  location: 'query' | 'params'
): ParameterObject[] {
  const openApiLocation = location === 'params' ? 'path' : 'query';
  const typeName = (schema._def as any).typeName as string;
  const zodType = (schema._def as any).type as string;

  if (typeName === 'ZodObject' || zodType === 'object') {
    const shape = (schema as z.ZodObject<any>).shape;
    return Object.entries(shape).map(([name, fieldSchema]) => {
      const field = fieldSchema as z.ZodTypeAny;
      const fieldDef = (field as any)._def;
      const optional = ['optional', 'default', 'nullable'].includes(
        fieldDef?.type
      );

      return {
        name,
        in: openApiLocation,
        required: location === 'params' || !optional,
        schema: zodToOpenApiSchema(field),
      };
    });
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

function buildResponses(
  value: any,
  handlerName: string
): Record<string, unknown> {
  const responseMetas: ResponseMetadata[] =
    Reflect.getMetadata(RESPONSE_METADATA_KEY, value.prototype, handlerName) ||
    [];

  if (!responseMetas.length) {
    return {
      '200': {
        description: 'Successful response',
      },
    };
  }

  const responses: Record<string, unknown> = {};
  responseMetas.forEach(meta => {
    const status =
      typeof meta.status === 'number' ? String(meta.status) : meta.status;
    responses[status] = {
      description: meta.description ?? 'Successful response',
      ...buildResponseContent(meta),
    };
  });

  return responses;
}

function loadControllerRoutes(): Record<string, PathItemObject> {
  const controllersDir = path.resolve(__dirname, '..');
  const controllerFiles = getControllerFiles(controllersDir);
  const paths: Record<string, PathItemObject> = {};

  controllerFiles.forEach(controllerFile => {
    const controllerModule = require(controllerFile) as Record<string, unknown>;

    Object.values(controllerModule).forEach(value => {
      if (typeof value !== 'function') {
        return;
      }

      const prefix = Reflect.getMetadata(METADATA_KEYS.PREFIX, value);
      const routes: RouteDefinition[] =
        Reflect.getMetadata(METADATA_KEYS.ROUTES, value) || [];

      if (!prefix || !routes?.length) {
        return;
      }

      routes.forEach(route => {
        const pathKey = `/api${joinRoutePath(prefix, route.path)}`;
        const operation: OperationObject = {
          summary: route.handlerName,
          operationId: `${value.name}_${route.handlerName}`,
          tags: [value.name.replace(/Controller$/, '')],
          responses: buildResponses(value, route.handlerName),
        };

        if (isProtectedPath(pathKey)) {
          operation.security = [{ bearerAuth: [] }];
        }

        const validationMetadata = getValidationMetadata(
          value,
          route.handlerName
        );
        validationMetadata.forEach(validation => {
          if (validation.property === 'body') {
            operation.requestBody = {
              required: true,
              content: {
                'application/json': {
                  schema: zodToOpenApiSchema(validation.schema),
                },
              },
            };
          } else {
            operation.parameters = [
              ...(operation.parameters || []),
              ...buildParameters(validation.schema, validation.property),
            ];
          }
        });

        if (pathKey === '/api/auth/refresh-token') {
          operation.parameters = [
            ...(operation.parameters || []),
            {
              name: 'refreshToken',
              in: 'cookie',
              required: true,
              schema: { type: 'string' },
            },
          ];
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
  'UserResponseSchema',
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
  NAMED_SCHEMAS.forEach(name => {
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
    servers: [
      { url: 'http://localhost:3000', description: 'Local development server' },
    ],
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
