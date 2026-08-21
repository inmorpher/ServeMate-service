import { AuthMiddleware } from '../../auth/auth.middleware';
import { ITokenService } from '../../auth/token.service.interface';

const tokenServiceMock = (): jest.Mocked<ITokenService> =>
  ({
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    revokeAccessToken: jest.fn(),
  }) as jest.Mocked<ITokenService>;

describe('AuthMiddleware', () => {
  it('passes an error when the authorization header is missing', async () => {
    const middleware = new AuthMiddleware(tokenServiceMock());
    const next = jest.fn();

    await middleware.execute({ headers: {} } as any, {} as any, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Authorization header missing',
      })
    );
  });

  it.each(['Basic token', 'Bearer', 'Bearer token extra'])(
    'rejects an invalid authorization header: %s',
    async authorization => {
      const tokenService = tokenServiceMock();
      const middleware = new AuthMiddleware(tokenService);
      const next = jest.fn();

      await middleware.execute(
        { headers: { authorization } } as any,
        {} as any,
        next
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid Authorization header format',
        })
      );
      expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
    }
  );

  it('attaches the decoded user and continues for a valid token', async () => {
    const tokenService = tokenServiceMock();
    const user = { id: 7, email: 'admin@example.com', role: 'ADMIN' };
    tokenService.verifyAccessToken.mockResolvedValue(user as any);
    const middleware = new AuthMiddleware(tokenService);
    const request = {
      headers: { authorization: 'Bearer access-token' },
    } as any;
    const next = jest.fn();

    await middleware.execute(request, {} as any, next);

    expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('access-token');
    expect(request.user).toEqual(user);
    expect(next).toHaveBeenCalledWith();
  });

  it('converts token verification failures to a 401 error', async () => {
    const tokenService = tokenServiceMock();
    tokenService.verifyAccessToken.mockRejectedValue(new Error('expired'));
    const middleware = new AuthMiddleware(tokenService);
    const next = jest.fn();

    await middleware.execute(
      { headers: { authorization: 'Bearer expired-token' } } as any,
      {} as any,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, message: 'Invalid token' })
    );
  });
});
