import { ContainerModule, ContainerModuleLoadOptions } from 'inversify';
import { TYPES } from '../types';

import { UserController } from './users.controller';
import { IUsersController } from './users.controller.interface';
import { UsersRepository } from './users.repository';
import { UserService } from './users.service';
import { IUsersService } from './users.service.interface';

export const userContainerModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<UsersRepository>(TYPES.UsersRepository)
      .to(UsersRepository)
      .inSingletonScope();
    bind<IUsersService>(TYPES.UsersService).to(UserService).inSingletonScope();
    bind<IUsersController>(TYPES.UsersController)
      .to(UserController)
      .inSingletonScope();
  }
);
