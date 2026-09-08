import { UserRole } from '@prisma/client';
import {
  UserController,
  UserControllerService,
} from '../../users/users.controller';

const serviceMock = (): jest.Mocked<UserControllerService> =>
  ({
    findUsers: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    updateUser: jest.fn(),
    validateCredentials: jest.fn(),
  }) as jest.Mocked<UserControllerService>;

const responseMock = () =>
  ({
    type: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  }) as any;

describe('UserController', () => {
  let service: jest.Mocked<UserControllerService>;
  let logger: any;
  let controller: UserController;
  let next: jest.Mock;

  beforeEach(() => {
    service = serviceMock();
    logger = { log: jest.fn(), warn: jest.fn(), debug: jest.fn() };
    controller = new UserController(logger, service);
    next = jest.fn();
  });

  it('passes validated query to findUsers', async () => {
    const result = {
      users: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };
    const query = {
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    } as any;
    service.findUsers.mockResolvedValue(result);
    const response = responseMock();

    await controller.findAll({ validated: { query } } as any, response, next);

    expect(service.findUsers).toHaveBeenCalledWith(query);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(result);
  });

  it('returns 404 and stops when a user is missing', async () => {
    service.findUserById.mockResolvedValue(null);
    const response = responseMock();

    await controller.findOne(
      { validated: { params: { id: 7 } } } as any,
      response,
      next
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'User not found',
      error: 'Not Found',
    });
    expect(response.status).toHaveBeenCalledTimes(1);
  });

  it('creates a user, logs the message and returns the result', async () => {
    const payload = {
      name: 'Alice',
      email: 'Alice@EXAMPLE.COM',
      role: UserRole.ADMIN,
      password: 'secret123',
    };
    const created = {
      id: 7,
      name: 'Alice',
      email: payload.email,
      role: UserRole.ADMIN,
    };
    service.createUser.mockResolvedValue(created);
    const response = responseMock();

    await controller.create(
      { validated: { body: payload } } as any,
      response,
      next
    );

    expect(service.createUser).toHaveBeenCalledWith(payload);
    expect(logger.log).toHaveBeenCalledWith(
      'User ALICE alice@example.com created successfully'
    );
    expect(response.json).toHaveBeenCalledWith(created);
  });

  it('forwards update and delete requests to the service', async () => {
    const response = responseMock();
    await controller.update(
      { validated: { params: { id: 7 }, body: { isActive: false } } } as any,
      response,
      next
    );
    await controller.delete(
      { validated: { params: { id: 7 } } } as any,
      response,
      next
    );

    expect(service.updateUser).toHaveBeenCalledWith(7, { isActive: false });
    expect(service.deleteUser).toHaveBeenCalledWith(7);
    expect(response.json).toHaveBeenCalledWith({
      message: 'User with ID 7 deleted successfully',
    });
  });
});
