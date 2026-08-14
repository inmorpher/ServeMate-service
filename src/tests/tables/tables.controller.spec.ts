import { TableCondition } from '@prisma/client';
import {
  TablesController,
  TablesControllerService,
} from '../../tables/tables.controller';

const serviceMock = (): jest.Mocked<TablesControllerService> =>
  ({
    findTables: jest.fn(),
    findTableById: jest.fn(),
    createTable: jest.fn(),
    updateTable: jest.fn(),
    deleteTable: jest.fn(),
    assignTables: jest.fn(),
  }) as jest.Mocked<TablesControllerService>;

const responseMock = () =>
  ({
    type: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  }) as any;

describe('TablesController', () => {
  let service: jest.Mocked<TablesControllerService>;
  let controller: TablesController;
  let next: jest.Mock;

  beforeEach(() => {
    service = serviceMock();
    controller = new TablesController(
      { log: jest.fn(), warn: jest.fn(), debug: jest.fn() } as any,
      service
    );
    next = jest.fn();
  });

  it('passes validated query to the service', async () => {
    const query = {
      page: 1,
      pageSize: 10,
      sortBy: 'id',
      sortOrder: 'asc',
    } as any;
    const result = {
      tables: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };
    service.findTables.mockResolvedValue(result);
    const response = responseMock();

    await controller.findAll({ validated: { query } } as any, response, next);

    expect(service.findTables).toHaveBeenCalledWith(query);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(result);
  });

  it('returns 404 when a table is missing', async () => {
    service.findTableById.mockResolvedValue(null);
    const response = responseMock();

    await controller.findOne(
      { validated: { params: { id: 7 } } } as any,
      response,
      next
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ message: 'Table not found' });
  });

  it('forwards create, update and delete requests', async () => {
    const payload = {
      tableNumber: 4,
      capacity: 2,
      additionalCapacity: 0,
      status: TableCondition.AVAILABLE,
    };
    service.createTable.mockResolvedValue({
      id: 1,
      ...payload,
      isOccupied: false,
      originalCapacity: 2,
      guests: 0,
    });
    const response = responseMock();

    await controller.create(
      { validated: { body: payload } } as any,
      response,
      next
    );
    await controller.update(
      {
        validated: { params: { id: 1 }, body: { isOccupied: true } },
      } as any,
      response,
      next
    );
    await controller.delete(
      { validated: { params: { id: 1 } } } as any,
      response,
      next
    );

    expect(service.createTable).toHaveBeenCalledWith(payload);
    expect(service.updateTable).toHaveBeenCalledWith(1, { isOccupied: true });
    expect(service.deleteTable).toHaveBeenCalledWith(1);
    expect(response.sendStatus).toHaveBeenCalledWith(201);
    expect(response.sendStatus).toHaveBeenCalledWith(204);
  });

  it('assigns tables to a server and returns a confirmation', async () => {
    const data = { serverId: 7, assignedTables: [1, 2], isPrimary: true };
    const response = responseMock();

    await controller.assign(
      { validated: { body: data } } as any,
      response,
      next
    );

    expect(service.assignTables).toHaveBeenCalledWith(data);
    expect(response.json).toHaveBeenCalledWith(
      'Tables 1, 2 assigned to server 7 successfully'
    );
  });
});
