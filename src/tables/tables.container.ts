import { ContainerModule, ContainerModuleLoadOptions } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { TablesController } from './tables.controller';
import { TablesRepository } from './tables.repository';
import { ITablesRepository } from './tables.repository.interface';
import { TablesService } from './tables.service';
import { ITablesService } from './tables.service.interface';

export const tablesContainerModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<ITablesRepository>(TYPES.TablesRepository)
      .to(TablesRepository)
      .inSingletonScope();
    bind<ITablesService>(TYPES.TablesService)
      .to(TablesService)
      .inSingletonScope();
    bind<TablesController>(TYPES.TablesController)
      .to(TablesController)
      .inSingletonScope();
  }
);
