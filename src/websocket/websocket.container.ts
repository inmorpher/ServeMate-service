import { ContainerModule, ContainerModuleLoadOptions } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { WebSocketService } from './websocket.service';
import { IWebSocketService } from './websocket.service.interface';

export const websocketContainerModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<IWebSocketService>(TYPES.WebSocketService)
      .to(WebSocketService)
      .inSingletonScope();
  }
);
