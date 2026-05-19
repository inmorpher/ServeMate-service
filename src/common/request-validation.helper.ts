import { Request } from 'express';
import { TypedRequest } from './route.interface';

type ValidationType = 'body' | 'query' | 'params';

export function getValidatedBody<TBody = unknown>(req: TypedRequest<any, any, TBody>): TBody {
    return (req.validated?.body ?? req.body) as TBody;
}

export function getValidatedQuery<TQuery = unknown>(
    req: TypedRequest<any, TQuery, any>
): TQuery {
    return (req.validated?.query ?? req.query) as TQuery;
}

export function getValidatedParams<TParams = unknown>(
    req: TypedRequest<TParams, any, any>
): TParams {
    return (req.validated?.params ?? req.params) as TParams;
}

export function getValidatedData<T = unknown>(
    req: Request & {
        validated?: Partial<Record<ValidationType, unknown>>;
    },
    type: ValidationType
): T {
    switch (type) {
        case 'body':
            return (req as any).validated?.body ?? req.body;
        case 'query':
            return (req as any).validated?.query ?? req.query;
        case 'params':
            return (req as any).validated?.params ?? req.params;
    }
}