import { IncomingMessage, Server } from 'http';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import WebSocket from 'ws';
import { DecodedUser, ITokenService } from '../auth/token.service.interface';
import { ILogger } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import { IWebSocketService } from './websocket.service.interface';
import { isRealtimeResource, RealtimeResource } from './websocket.types';

export interface IWebSocketGateway {
  initialize(server: Server): void;
}

@injectable()
export class WebSocketGateway implements IWebSocketGateway {
  constructor(
    @inject(TYPES.ITokenService)
    private readonly tokenService: ITokenService,
    @inject(TYPES.WebSocketService)
    private readonly websocketService: IWebSocketService,
    @inject(TYPES.ILogger)
    private readonly logger: ILogger
  ) {}

  initialize(server: Server): void {
    const websocketServer = new WebSocket.Server({
      server,
      path: '/ws',
    });

    websocketServer.on(
      'connection',
      async (ws: WebSocket, request: IncomingMessage) => {
        this.logger.log(
          `WebSocket client connected from ${request.socket.remoteAddress}`
        );

        const connection = await this.authenticate(ws, request);
        if (!connection) {
          return;
        }

        const subscription = this.getSubscription(
          request.url,
          request.headers.host
        );
        if (!subscription) {
          this.reject(ws, 'Missing or invalid resource');
          return;
        }

        const subscriptionEntityId =
          subscription.resource === 'workspace'
            ? (subscription.entityId ?? String(connection.id))
            : subscription.entityId;

        if (
          subscription.resource === 'workspace' &&
          subscriptionEntityId !== String(connection.id)
        ) {
          this.logger.warn(
            `WebSocket connection rejected: User ${connection.id} requested another workspace`
          );
          this.reject(ws, 'Workspace access denied');
          return;
        }

        this.websocketService.subscribe(
          subscription.resource,
          subscriptionEntityId,
          String(connection.id),
          ws
        );

        ws.on('message', message =>
          this.handleMessage(ws, connection, message)
        );
        ws.on('error', error => {
          this.logger.error(
            `WebSocket error for user ${connection.id}:`,
            error
          );
        });
        ws.on('close', () => this.websocketService.unsubscribe(ws));
      }
    );

    this.logger.log(`\x1b[36m✓\x1b[0m WebSocket Server initialized`);
  }

  private async authenticate(
    ws: WebSocket,
    request: IncomingMessage
  ): Promise<DecodedUser | null> {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const authorization = request.headers.authorization;
    const headerAccessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;
    const accessToken =
      headerAccessToken || url.searchParams.get('accessToken');

    if (!accessToken) {
      this.reject(ws, 'Missing access token');
      return null;
    }

    try {
      return await this.tokenService.verifyAccessToken(accessToken);
    } catch {
      this.logger.warn('WebSocket connection rejected: Invalid access token');
      this.reject(ws, 'Invalid access token');
      return null;
    }
  }

  private getSubscription(
    requestUrl: string | undefined,
    host: string | undefined
  ): { resource: RealtimeResource; entityId?: string } | null {
    const url = new URL(requestUrl || '', `http://${host}`);
    const resourceParam = url.searchParams.get('resource');
    const orderId = url.searchParams.get('orderId');
    const resource = resourceParam
      ? isRealtimeResource(resourceParam)
        ? resourceParam
        : null
      : orderId
        ? 'orders'
        : null;

    if (!resource) {
      return null;
    }

    return {
      resource,
      entityId: url.searchParams.get('entityId') || orderId || undefined,
    };
  }

  private handleMessage(
    ws: WebSocket,
    user: DecodedUser,
    message: WebSocket.RawData
  ): void {
    try {
      const data = JSON.parse(message.toString());
      this.logger.log(`WebSocket message from ${user.id}:`, data);
    } catch (error) {
      this.logger.error('Invalid WebSocket message:', error);
      ws.send(
        JSON.stringify({ type: 'error', data: 'Invalid message format' })
      );
    }
  }

  private reject(ws: WebSocket, reason: string): void {
    this.logger.warn(`WebSocket connection rejected: ${reason}`);
    ws.close(1008, reason);
  }
}
