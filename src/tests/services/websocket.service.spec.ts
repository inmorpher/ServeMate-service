import WebSocket from 'ws';
import { ILogger } from '../../logger/logger.service.interface';
import { WebSocketService } from '../../websocket/websocket.service';
import { RealtimeEvent } from '../../websocket/websocket.types';

type MockSocket = {
  readyState: number;
  send: jest.Mock;
};

const logger = (): jest.Mocked<ILogger> =>
  ({
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
  }) as jest.Mocked<ILogger>;

const socket = (): MockSocket => ({
  readyState: WebSocket.OPEN,
  send: jest.fn(),
});

const event = (overrides: Partial<RealtimeEvent> = {}): RealtimeEvent => ({
  id: 'event-1',
  type: 'orders.updated',
  resource: 'orders',
  entityId: 42,
  payload: { status: 'READY' },
  occurredAt: '2026-09-03T12:00:00.000Z',
  ...overrides,
});

describe('WebSocketService', () => {
  it('sends a subscription confirmation and tracks the subscriber', () => {
    const service = new WebSocketService(logger());
    const client = socket();

    service.subscribe('orders', '42', 'user-1', client as unknown as WebSocket);

    expect(service.getActiveSubscribers('orders', '42')).toBe(1);
    expect(client.send).toHaveBeenCalledTimes(1);
    expect(JSON.parse(client.send.mock.calls[0][0])).toEqual(
      expect.objectContaining({
        type: 'websocket.subscribed',
        resource: 'orders',
        entityId: '42',
        payload: { userId: 'user-1' },
      })
    );
  });

  it('does not register the same socket subscription twice', () => {
    const service = new WebSocketService(logger());
    const client = socket() as unknown as WebSocket;

    service.subscribe('orders', '42', 'user-1', client);
    service.subscribe('orders', '42', 'user-1', client);

    expect(service.getActiveSubscribers('orders', '42')).toBe(1);
    expect((client as unknown as MockSocket).send).toHaveBeenCalledTimes(1);
  });

  it('publishes entity events to entity and resource-list subscribers', () => {
    const service = new WebSocketService(logger());
    const entityClient = socket();
    const listClient = socket();
    const otherEntityClient = socket();

    service.subscribe(
      'orders',
      '42',
      'user-1',
      entityClient as unknown as WebSocket
    );
    service.subscribe(
      'orders',
      undefined,
      'user-2',
      listClient as unknown as WebSocket
    );
    service.subscribe(
      'orders',
      '99',
      'user-3',
      otherEntityClient as unknown as WebSocket
    );

    entityClient.send.mockClear();
    listClient.send.mockClear();
    otherEntityClient.send.mockClear();

    service.publish(event());

    expect(entityClient.send).toHaveBeenCalledWith(JSON.stringify(event()));
    expect(listClient.send).toHaveBeenCalledWith(JSON.stringify(event()));
    expect(otherEntityClient.send).not.toHaveBeenCalled();
  });

  it('does not send events from another resource', () => {
    const service = new WebSocketService(logger());
    const client = socket();

    service.subscribe(
      'orders',
      undefined,
      'user-1',
      client as unknown as WebSocket
    );
    client.send.mockClear();

    service.publish(event({ resource: 'tables', type: 'tables.updated' }));

    expect(client.send).not.toHaveBeenCalled();
  });

  it('removes a socket when it unsubscribes or closes', () => {
    const service = new WebSocketService(logger());
    const client = socket();
    const clientAsWebSocket = client as unknown as WebSocket;

    service.subscribe('orders', '42', 'user-1', clientAsWebSocket);
    service.unsubscribe(clientAsWebSocket);

    expect(service.getActiveSubscribers('orders', '42')).toBe(0);

    service.subscribe('orders', '42', 'user-1', clientAsWebSocket);
    client.readyState = WebSocket.CLOSED;
    service.publish(event());

    expect(service.getActiveSubscribers('orders', '42')).toBe(0);
    expect(client.send).toHaveBeenCalledTimes(2);
  });
});
