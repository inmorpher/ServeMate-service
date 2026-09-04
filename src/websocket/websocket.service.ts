import { randomUUID } from 'crypto';
import { inject, injectable } from 'inversify';
import WebSocket from 'ws';
import { ILogger } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import { IWebSocketService } from './websocket.service.interface';
import { RealtimeEvent, RealtimeResource } from './websocket.types';

type Subscriber = {
  resource: RealtimeResource;
  entityId?: string;
  userId: string;
  ws: WebSocket;
};

@injectable()
export class WebSocketService implements IWebSocketService {
  private readonly subscribers = new Set<Subscriber>();

  constructor(@inject(TYPES.ILogger) private readonly logger: ILogger) {}

  subscribe(
    resource: RealtimeResource,
    entityId: string | undefined,
    userId: string,
    ws: WebSocket
  ): void {
    const alreadySubscribed = [...this.subscribers].some(
      subscriber =>
        subscriber.ws === ws &&
        subscriber.resource === resource &&
        subscriber.entityId === entityId
    );

    if (alreadySubscribed) {
      return;
    }

    this.subscribers.add({ resource, entityId, userId, ws });
    this.send(ws, {
      id: randomUUID(),
      type: 'websocket.subscribed',
      resource,
      entityId,
      payload: { userId },
      occurredAt: new Date().toISOString(),
    });
    this.logger.log(
      `User ${userId} subscribed to ${resource}${entityId ? `:${entityId}` : ''}`
    );
  }

  unsubscribe(ws: WebSocket): void {
    for (const subscriber of this.subscribers) {
      if (subscriber.ws === ws) {
        this.subscribers.delete(subscriber);
      }
    }
  }

  publish(event: RealtimeEvent): void {
    for (const subscriber of this.subscribers) {
      if (subscriber.ws.readyState !== WebSocket.OPEN) {
        this.subscribers.delete(subscriber);
        continue;
      }

      const matchesResource = subscriber.resource === event.resource;
      const matchesEntity =
        subscriber.entityId === undefined ||
        String(subscriber.entityId) === String(event.entityId);

      if (matchesResource && matchesEntity) {
        this.send(subscriber.ws, event);
      }
    }
  }

  getActiveSubscribers(resource: RealtimeResource, entityId?: string): number {
    return [...this.subscribers].filter(
      subscriber =>
        subscriber.resource === resource &&
        (entityId === undefined || subscriber.entityId === entityId)
    ).length;
  }

  private send(ws: WebSocket, event: RealtimeEvent): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }
}
