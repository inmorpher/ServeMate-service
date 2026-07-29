// src/auth/auth.container.ts
import { ContainerModule, ContainerModuleLoadOptions } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { AuthenticationController } from './auth.controller';
import { IAuthController } from './auth.controller.interface';
import { AuthMiddleware } from './auth.middleware';
import { AuthRepository } from './auth.repository';
import { IAuthRepository } from './auth.repository.interface';
import { AuthService } from './auth.service';
import { IAuthService } from './auth.service.interface';
import { TokenService } from './token.service';
import { ITokenService } from './token.service.interface';

export const authContainerModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<ITokenService>(TYPES.ITokenService)
      .to(TokenService)
      .inSingletonScope();
    bind<IAuthRepository>(TYPES.AuthRepository)
      .to(AuthRepository)
      .inSingletonScope();
    bind<IAuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
    bind<AuthMiddleware>(TYPES.AuthMiddleware)
      .to(AuthMiddleware)
      .inSingletonScope();
    bind<IAuthController>(TYPES.AuthenticationController)
      .to(AuthenticationController)
      .inSingletonScope();
  }
);
