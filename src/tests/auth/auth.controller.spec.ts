import { AuthenticationController } from '../../auth/auth.controller';
import { IAuthService } from '../../auth/auth.service.interface';

const serviceMock = (): jest.Mocked<IAuthService> =>
  ({
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    me: jest.fn(),
  }) as jest.Mocked<IAuthService>;

const responseMock = () =>
  ({
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }) as any;

describe('AuthenticationController', () => {
  let service: jest.Mocked<IAuthService>;
  let controller: AuthenticationController;
  let next: jest.Mock;

  beforeEach(() => {
    service = serviceMock();
    controller = new AuthenticationController(
      {
        log: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
      } as any,
      service
    );
    next = jest.fn();
  });

  it('sets a refresh cookie after login', async () => {
    const result = {
      user: { id: 1, name: 'User', email: 'user@example.com', role: 'USER' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600000,
    } as any;
    service.login.mockResolvedValue(result);
    const response = responseMock();

    await controller.login(
      {
        validated: {
          body: { email: 'user@example.com', password: 'password' },
        },
        ip: '127.0.0.1',
        headers: {},
      } as any,
      response,
      next
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({ httpOnly: true, path: '/api/auth' })
    );
    expect(response.json).toHaveBeenCalledWith(result);
  });

  it.each([
    [
      { body: { refreshToken: 'body-token' }, cookies: {}, headers: {} },
      'body-token',
    ],
    [
      { body: {}, cookies: { refreshToken: 'cookie-token' }, headers: {} },
      'cookie-token',
    ],
  ])('refreshes with a token from %s', async (request, expectedToken) => {
    const result = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600000,
    };
    service.refresh.mockResolvedValue(result);
    const response = responseMock();

    await controller.refreshToken(request as any, response, next);

    expect(service.refresh).toHaveBeenCalledWith(
      expectedToken,
      expect.objectContaining({ ipAddress: null })
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'new-refresh-token',
      expect.objectContaining({ path: '/api/auth' })
    );
  });

  it('rejects a request containing both cookie and body tokens', async () => {
    const response = responseMock();

    await controller.refreshToken(
      {
        body: { refreshToken: 'body-token' },
        cookies: { refreshToken: 'cookie-token' },
        headers: {},
      } as any,
      response,
      next
    );

    expect(service.refresh).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Provide refresh token in cookie or body, not both',
      error: 'Bad Request',
    });
  });
});
