import WebSocket from 'ws';
import { RealtimeEvent, RealtimeResource } from './websocket.types';

export interface IWebSocketService {
  subscribe(
    resource: RealtimeResource,
    entityId: string | undefined,
    userId: string,
    ws: WebSocket
  ): void;
  unsubscribe(ws: WebSocket): void;
  publish(event: RealtimeEvent): void;
  getActiveSubscribers(resource: RealtimeResource, entityId?: string): number;
}
