import { z } from 'zod';
import { ValidateMiddleware } from '../../middleware/validate/validate.middleware';

const responseMock = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

describe('ValidateMiddleware', () => {
  it.each([
    ['body', { body: { name: 'Soup' } }],
    ['query', { query: { page: '2' } }],
    ['params', { params: { id: '42' } }],
  ] as const)('validates and stores %s data', (type, request) => {
    const schema =
      type === 'body'
        ? z.object({ name: z.string() })
        : z.object({ [type === 'query' ? 'page' : 'id']: z.coerce.number() });
    const middleware = new ValidateMiddleware(schema, type);
    const next = jest.fn();

    middleware.execute(request as any, responseMock() as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((request as any).validated[type]).toEqual(
      type === 'body'
        ? { name: 'Soup' }
        : type === 'query'
          ? { page: 2 }
          : { id: 42 }
    );
  });

  it('returns validation issues with status 422', () => {
    const middleware = new ValidateMiddleware(
      z.object({ name: z.string().min(3) }),
      'body'
    );
    const response = responseMock();
    const next = jest.fn();

    middleware.execute({ body: { name: 'x' } } as any, response as any, next);

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.send).toHaveBeenCalledWith([
      { path: 'name', message: expect.any(String) },
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns status 500 for an unexpected schema error', () => {
    const schema = {
      parse: () => {
        throw new Error('unexpected');
      },
    } as unknown as z.ZodType;
    const middleware = new ValidateMiddleware(schema, 'body');
    const response = responseMock();

    middleware.execute({ body: {} } as any, response as any, jest.fn());

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith('Internal Server Error');
  });
});
