import { UserRole } from '@prisma/client';
import cookieParser from 'cookie-parser';
import express, { Express } from 'express';
import { createServer, Server } from 'http';
import { AuthMiddleware } from '../../auth/auth.middleware';
import { ITokenService } from '../../auth/token.service.interface';
import {
  METADATA_KEYS,
  RouteDefinition,
} from '../../decorators/httpDecorators';
import { ExceptionFilter } from '../../errors/exception.filter';
import {
  UserController,
  UserControllerService,
} from '../../users/users.controller';

const logger = {
  debug: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
};

const tokenServiceMock = (): jest.Mocked<ITokenService> =>
  ({
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    revokeAccessToken: jest.fn(),
  }) as jest.Mocked<ITokenService>;

const serviceMock = (): jest.Mocked<UserControllerService> =>
  ({
    findUsers: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    updateUser: jest.fn(),
    validateCredentials: jest.fn(),
  }) as jest.Mocked<UserControllerService>;

const registerController = (app: Express, controller: UserController) => {
  const prefix = Reflect.getMetadata(
    METADATA_KEYS.PREFIX,
    controller.constructor
  );
  const routes = Reflect.getMetadata(
    METADATA_KEYS.ROUTES,
    controller.constructor
  ) as RouteDefinition[];
  const router = express.Router();

  routes.forEach(route => {
    const handler = (controller as any)[route.handlerName].bind(controller);
    const middlewares = (route.middlewares || []).map(middleware =>
      middleware.execute.bind(middleware)
    );
    router[route.method](prefix + route.path, ...middlewares, handler);
  });

  app.use('/api', router);
};

describe('Users HTTP integration', () => {
  let app: Express;
  let server: Server;
  let baseUrl: string;
  let service: jest.Mocked<UserControllerService>;
  let tokenService: jest.Mocked<ITokenService>;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    service = serviceMock();
    tokenService = tokenServiceMock();
    const authMiddleware = new AuthMiddleware(tokenService);
    const controller = new UserController(logger as any, service);
    const exceptionFilter = new ExceptionFilter(logger as any);

    app.use('/api', (req, res, next) => authMiddleware.execute(req, res, next));
    registerController(app, controller);
    app.use(exceptionFilter.catch.bind(exceptionFilter));

    server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a TCP address');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service.findUsers.mockResolvedValue({ users: [], total: 0 } as any);
  });

  it('returns 401 through the HTTP error pipeline without a token', async () => {
    const response = await fetch(`${baseUrl}/api/users/`);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Authorization header missing',
    });
    expect(service.findUsers).not.toHaveBeenCalled();
  });

  it('returns 403 when the authenticated user has an insufficient role', async () => {
    tokenService.verifyAccessToken.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      role: UserRole.USER,
    });

    const response = await fetch(`${baseUrl}/api/users/`, {
      headers: { Authorization: 'Bearer user-token' },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(service.findUsers).not.toHaveBeenCalled();
  });

  it('validates the query and reaches the controller for an admin user', async () => {
    tokenService.verifyAccessToken.mockResolvedValue({
      id: 1,
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });

    const response = await fetch(`${baseUrl}/api/users/?page=2&pageSize=5`, {
      headers: { Authorization: 'Bearer admin-token' },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ users: [], total: 0 });
    expect(service.findUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 5 })
    );
  });

  it('returns 422 for an invalid query before calling the service', async () => {
    tokenService.verifyAccessToken.mockResolvedValue({
      id: 1,
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });

    const response = await fetch(`${baseUrl}/api/users/?page=0`, {
      headers: { Authorization: 'Bearer admin-token' },
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual([
      { path: 'page', message: expect.any(String) },
    ]);
    expect(service.findUsers).not.toHaveBeenCalled();
  });
});
