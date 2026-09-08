import { UserRole } from '@prisma/client';
import { RoleMiddleware } from '../../middleware/role/role.middleware';

const responseMock = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

describe('RoleMiddleware', () => {
  it('rejects a request without an authenticated user', () => {
    const middleware = new RoleMiddleware([UserRole.ADMIN]);
    const response = responseMock();
    const next = jest.fn();

    middleware.execute({} as any, response as any, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.send).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows any authenticated user when no roles are required', () => {
    const middleware = new RoleMiddleware([]);
    const next = jest.fn();

    middleware.execute(
      {
        user: { id: 1, email: 'user@example.com', role: UserRole.USER },
      } as any,
      responseMock() as any,
      next
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects an authenticated user with an unlisted role', () => {
    const middleware = new RoleMiddleware([UserRole.ADMIN]);
    const response = responseMock();
    const next = jest.fn();

    middleware.execute(
      {
        user: { id: 1, email: 'user@example.com', role: UserRole.USER },
      } as any,
      response as any,
      next
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.send).toHaveBeenCalledWith({
      statusCode: 403,
      message: 'Forbidden',
      error: 'Forbidden',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows an authenticated user with an accepted role', () => {
    const middleware = new RoleMiddleware([UserRole.ADMIN, UserRole.MANAGER]);
    const next = jest.fn();

    middleware.execute(
      {
        user: { id: 1, email: 'manager@example.com', role: UserRole.MANAGER },
      } as any,
      responseMock() as any,
      next
    );

    expect(next).toHaveBeenCalledTimes(1);
  });
});
