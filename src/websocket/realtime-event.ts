import { randomUUID } from 'crypto';
import { IWebSocketService } from './websocket.service.interface';
import { RealtimeEvent, RealtimeResource } from './websocket.types';

export function publishRealtimeEvent(
  gateway: IWebSocketService | undefined,
  resource: RealtimeResource,
  type: string,
  entityId?: string | number,
  payload?: unknown
): void {
  if (!gateway) {
    return;
  }

  const event: RealtimeEvent = {
    id: randomUUID(),
    type: `${resource}.${type}`,
    resource,
    entityId,
    payload,
    occurredAt: new Date().toISOString(),
  };

  gateway.publish(event);
}
