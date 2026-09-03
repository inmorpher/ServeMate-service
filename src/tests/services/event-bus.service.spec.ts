import { ILogger } from '../../logger/logger.service.interface';
import { EventBus } from '../../services/events/event-bus.service';

const logger = (): jest.Mocked<ILogger> =>
  ({
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
  }) as jest.Mocked<ILogger>;

describe('EventBus', () => {
  it('delivers events and supports unsubscribe', async () => {
    const bus = new EventBus(logger());
    const handler = jest.fn();
    const unsubscribe = bus.subscribe('workspace.updated', handler);
    const event = EventBus.createWorkspaceUpdatedEvent(
      7,
      2,
      '2026-08-21T00:00:00.000Z'
    );

    await bus.publish(event);
    unsubscribe();
    await bus.publish(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('isolates a failed handler from other handlers', async () => {
    const log = logger();
    const bus = new EventBus(log);
    const successfulHandler = jest.fn();
    bus.subscribe('workspace.updated', async () => {
      throw new Error('listener failed');
    });
    bus.subscribe('workspace.updated', successfulHandler);

    await bus.publish(EventBus.createWorkspaceUpdatedEvent(7, 2, 'now'));

    expect(successfulHandler).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      expect.stringContaining('workspace.updated'),
      expect.any(Error)
    );
  });
});
