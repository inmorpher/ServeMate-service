import { ContainerModule, ContainerModuleLoadOptions } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { IWebSocketGateway, WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { IWebSocketService } from './websocket.service.interface';

export const websocketContainerModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<IWebSocketService>(TYPES.WebSocketService)
      .to(WebSocketService)
      .inSingletonScope();
    bind<IWebSocketGateway>(TYPES.WebSocketGateway)
      .to(WebSocketGateway)
      .inSingletonScope();
  }
);
