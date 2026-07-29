import '../helpers/mock-dto-package';
import '../helpers/mock-inversify';

import { AuthenticationController } from '../../controllers/auth/auth.controller';
import { UserRole } from '../../dto-package';
import { ITokenService } from '../../old/tokens/token.service.interface';
import { ILogger } from '../../services/logger/logger.service.interface';
import { UserService } from '../../services/users/user.service';
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from '../helpers/http-test-utils';

jest.mock('../../../env', () => ({
  ENV: {
    PRODUCTION: false,
    PORT: 3000,
    DATABASE_URL: 'postgres://test',
    TOKEN_CACHE_TTL: 3600000,
    JWT_SECRET: 'access-secret',
    JWT_REFRESH: 'refresh-secret',
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_EXPIRES_IN: '7d',
    LOG_TO_FILE: false,
  },
}));

describe('AuthenticationController', () => {
  const createLoggerMock = () =>
    ({
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      silly: jest.fn(),
      setContext: jest.fn(),
    }) as unknown as ILogger;

  const createUserServiceMock = () =>
    ({
      validateUser: jest.fn(),
      updateUser: jest.fn(),
      findUserById: jest.fn(),
    }) as unknown as UserService;

  const createTokenServiceMock = () =>
    ({
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      revokeToken: jest.fn(),
      refreshToken: jest.fn(),
      authenticate: jest.fn(),
    }) as unknown as ITokenService;

  it('logs in a user and returns tokens', async () => {
    const logger = createLoggerMock();
    const userService = createUserServiceMock();
    const tokenService = createTokenServiceMock();
    const controller = new AuthenticationController(
      logger,
      tokenService,
      userService
    );
    const user = {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      role: UserRole.ADMIN,
    };
    (userService.validateUser as jest.Mock).mockResolvedValue(user);
    (tokenService.generateAccessToken as jest.Mock).mockResolvedValue({
      accessToken: 'access-token',
      expiresIn: 3600,
    });
    (tokenService.generateRefreshToken as jest.Mock).mockResolvedValue(
      'refresh-token'
    );
    (userService.updateUser as jest.Mock).mockResolvedValue(undefined);

    const req = createMockRequest({
      body: {
        email: 'alice@example.com',
        password: 'secret',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await controller.login(req as any, res, next);

    expect(userService.validateUser).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'secret',
    });
    expect(tokenService.generateAccessToken).toHaveBeenCalledWith(user);
    expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(user);
    expect(userService.updateUser).toHaveBeenCalledWith(1, {
      lastLogin: expect.any(Date),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns a bad request for invalid login credentials', async () => {
    const logger = createLoggerMock();
    const userService = createUserServiceMock();
    const tokenService = createTokenServiceMock();
    const controller = new AuthenticationController(
      logger,
      tokenService,
      userService
    );
    (userService.validateUser as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest({
      body: {
        email: 'alice@example.com',
        password: 'bad-password',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await controller.login(req as any, res, next);

    expect(logger.warn).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid email or password',
    });
    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
  });

  it('logs out without requiring an authorization header', async () => {
    const logger = createLoggerMock();
    const userService = createUserServiceMock();
    const tokenService = createTokenServiceMock();
    const controller = new AuthenticationController(
      logger,
      tokenService,
      userService
    );
    const req = createMockRequest({
      headers: {},
      cookies: {},
    });
    const res = createMockResponse();
    const next = createMockNext();

    await controller.logout(req as any, res, next);

    expect(tokenService.revokeToken).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken');
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Logged out successfully',
    });
  });

  it('revokes both access and refresh tokens on logout', async () => {
    const logger = createLoggerMock();
    const userService = createUserServiceMock();
    const tokenService = createTokenServiceMock();
    const controller = new AuthenticationController(
      logger,
      tokenService,
      userService
    );
    const req = createMockRequest({
      headers: { authorization: 'Bearer access-token' },
      cookies: { refreshToken: 'refresh-token' },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await controller.logout(req as any, res, next);

    expect(tokenService.revokeToken).toHaveBeenCalledWith('access-token');
    expect(tokenService.revokeToken).toHaveBeenCalledWith('refresh-token');
  });

  it('returns unauthorized when refresh token is missing', async () => {
    const logger = createLoggerMock();
    const userService = createUserServiceMock();
    const tokenService = createTokenServiceMock();
    const controller = new AuthenticationController(
      logger,
      tokenService,
      userService
    );
    const req = createMockRequest({ body: {} });
    const res = createMockResponse();
    const next = createMockNext();

    await controller.refreshToken(req as any, res, next);

    expect(logger.warn).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Refresh token not provided',
    });
  });

  it('refreshes tokens when a valid refresh token is supplied', async () => {
    const logger = createLoggerMock();
    const userService = createUserServiceMock();
    const tokenService = createTokenServiceMock();
    const controller = new AuthenticationController(
      logger,
      tokenService,
      userService
    );
    (tokenService.refreshToken as jest.Mock).mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 7200,
    });
    const req = createMockRequest({
      body: { refreshToken: 'old-refresh-token' },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await controller.refreshToken(req as any, res, next);

    expect(tokenService.refreshToken).toHaveBeenCalledWith(
      'old-refresh-token',
      userService
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 7200,
    });
  });

  it('returns the authenticated user from me()', async () => {
    const logger = createLoggerMock();
    const userService = createUserServiceMock();
    const tokenService = createTokenServiceMock();
    const controller = new AuthenticationController(
      logger,
      tokenService,
      userService
    );
    (userService.findUserById as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Alice',
    });
    const req = createMockRequest({
      user: { id: 1, email: 'alice@example.com', role: UserRole.ADMIN },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await controller.me(req as any, res, next);

    expect(userService.findUserById).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: { id: 1, name: 'Alice' } });
  });

  it('returns unauthorized from me() when there is no authenticated user', async () => {
    const logger = createLoggerMock();
    const userService = createUserServiceMock();
    const tokenService = createTokenServiceMock();
    const controller = new AuthenticationController(
      logger,
      tokenService,
      userService
    );
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    await controller.me(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Пользователь не аутентифицирован',
    });
  });
});
