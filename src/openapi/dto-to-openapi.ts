// src/openapi/dto-to-openapi.ts
import { z } from 'zod';

export type OpenApiSchemaLike = Record<string, unknown>;

function getZodType(schema: z.ZodTypeAny): string {
  // Zod v4: _def.type
  const def = (schema as any)._def;
  if (def?.type) return def.type;
  // Fallback
  return schema.constructor?.name;
}

function isOptionalLike(schema: z.ZodTypeAny): boolean {
  const type = getZodType(schema);
  return (
    type === 'ZodOptional' ||
    type === 'ZodDefault' ||
    type === 'ZodNullable' ||
    type === 'optional' ||
    type === 'default' ||
    type === 'nullable'
  );
}

function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  const def = (schema as any)._def;
  const type = getZodType(schema);

  if (
    type === 'ZodOptional' ||
    type === 'ZodDefault' ||
    type === 'ZodNullable' ||
    type === 'optional' ||
    type === 'default' ||
    type === 'nullable'
  ) {
    return unwrap(def.innerType ?? def.schema);
  }
  if (type === 'ZodEffects') {
    return unwrap(def.schema ?? def.innerType);
  }
  if (type === 'ZodPipeline') {
    return unwrap(def.out ?? def.in);
  }
  if (type === 'pipe') {
    return unwrap(def.out ?? def.in);
  }
  return schema;
}

function nativeEnumValues(def: any): string[] {
  const entries = Object.entries(def.values ?? def.entries ?? {});
  const filtered = entries.filter(([key]) => isNaN(Number(key)));
  return [
    ...new Set(
      filtered
        .map(([, value]) => value)
        .filter((v): v is string => typeof v === 'string')
    ),
  ];
}

export function zodToOpenApiSchema(
  schema: z.ZodTypeAny,
  visited = new Set<unknown>()
): OpenApiSchemaLike {
  const unwrapped = unwrap(schema);
  const def = (unwrapped as any)._def;
  const type = getZodType(unwrapped);

  switch (type) {
    case 'ZodString':
    case 'string':
      const checks = def.checks || [];
      const isDatetime = checks.some(
        (c: any) => c.kind === 'datetime' || c.kind === 'iso'
      );
      return isDatetime
        ? { type: 'string', format: 'date-time' }
        : { type: 'string' };
    case 'ZodNumber':
    case 'number':
      return { type: 'number' };
    case 'ZodBoolean':
    case 'boolean':
      return { type: 'boolean' };
    case 'ZodDate':
    case 'ZodISODateTime':
    case 'date':
      return { type: 'string', format: 'date-time' };
    case 'ZodEnum':
    case 'enum':
      return { type: 'string', enum: def.values };
    case 'ZodNativeEnum':
      return { type: 'string', enum: nativeEnumValues(def) };
    case 'ZodArray':
    case 'array':
      return {
        type: 'array',
        items: zodToOpenApiSchema(def.element ?? def.type, visited),
      };
    case 'ZodObject':
    case 'object': {
      const shape = (unwrapped as any).shape;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      Object.entries(shape).forEach(([key, value]) => {
        const child = value as z.ZodTypeAny;
        if (!isOptionalLike(child)) required.push(key);
        properties[key] = zodToOpenApiSchema(child, visited);
      });

      return {
        type: 'object',
        properties,
        ...(required.length ? { required } : {}),
      };
    }
    case 'ZodUnion':
    case 'union':
    case 'ZodDiscriminatedUnion':
      return {
        oneOf: def.options.map((o: z.ZodTypeAny) =>
          zodToOpenApiSchema(o, visited)
        ),
      };
    case 'ZodLiteral':
    case 'literal':
      return {
        type: typeof def.value === 'number' ? 'number' : 'string',
        enum: [def.value],
      };
    case 'ZodRecord':
    case 'record':
      return {
        type: 'object',
        additionalProperties: zodToOpenApiSchema(def.valueType, visited),
      };
    case 'ZodTuple':
    case 'tuple':
      return {
        type: 'array',
        prefixItems: def.items.map((item: z.ZodTypeAny) =>
          zodToOpenApiSchema(item, visited)
        ),
      };
    case 'ZodLazy':
    case 'lazy':
      return zodToOpenApiSchema(def.getter(), visited);
    case 'ZodTransform':
    case 'transform':
      return { type: 'string' };
    case 'ZodAny':
    case 'ZodUnknown':
    case 'any':
    case 'unknown':
      return {};
    case 'ZodIntersection':
    case 'intersection':
      return {
        allOf: [
          zodToOpenApiSchema(def.left, visited),
          zodToOpenApiSchema(def.right, visited),
        ],
      };
    default:
      console.warn('Unknown Zod type:', type, def);
      return { type: 'object' };
  }
}
