import '../helpers/mock-dto-package';
import '../helpers/mock-inversify';

import 'reflect-metadata';
import { z } from 'zod';
import { Validate, ValidateMiddleware } from '../../middleware/validate/validate.middleware';
import { createMockNext, createMockRequest, createMockResponse } from '../helpers/http-test-utils';

describe('ValidateMiddleware', () => {
	it('stores validated body data and calls next', () => {
		const schema = z.object({ name: z.string() });
		const middleware = new ValidateMiddleware(schema, 'body');
		const req = createMockRequest({ body: { name: 'Alice' } });
		const res = createMockResponse();
		const next = createMockNext();

		middleware.execute(req, res, next);

		expect((req as any).validated.body).toEqual({ name: 'Alice' });
		expect(next).toHaveBeenCalledTimes(1);
		expect(res.status).not.toHaveBeenCalled();
	});

	it('validates query data and returns 422 on failure', () => {
		const schema = z.object({ page: z.coerce.number().int().positive() });
		const middleware = new ValidateMiddleware(schema, 'query');
		const req = createMockRequest({ query: { page: '0' } });
		const res = createMockResponse();
		const next = createMockNext();

		middleware.execute(req, res, next);

		expect(next).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(422);
		expect(res.send).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ path: 'page' }),
			])
		);
	});

	it('validates params data', () => {
		const schema = z.object({ id: z.coerce.number().int().positive() });
		const middleware = new ValidateMiddleware(schema, 'params');
		const req = createMockRequest({ params: { id: '5' } });
		const res = createMockResponse();
		const next = createMockNext();

		middleware.execute(req, res, next);

		expect((req as any).validated.params).toEqual({ id: 5 });
		expect(next).toHaveBeenCalledTimes(1);
	});
});

describe('Validate decorator', () => {
	it('registers validation metadata and attaches middleware to a route', () => {
		const schema = z.object({ id: z.coerce.number().positive() });

		class DummyController {
			handle() {
				return undefined;
			}
		}

		Reflect.defineMetadata(
			'routes',
			[
				{
					handlerName: 'handle',
					method: 'get',
					path: '/dummy',
				},
			],
			DummyController
		);

		Validate(schema, 'params')(
			DummyController.prototype,
			'handle',
			Object.getOwnPropertyDescriptor(DummyController.prototype, 'handle') as PropertyDescriptor
		);

		const routes = Reflect.getMetadata('routes', DummyController);
		expect(routes[0].middlewares).toHaveLength(1);
		expect(routes[0].middlewares[0]).toBeInstanceOf(ValidateMiddleware);
		expect(Reflect.getMetadata('validate', DummyController.prototype, 'handle')).toEqual({
			schema,
			property: 'params',
		});
	});
});