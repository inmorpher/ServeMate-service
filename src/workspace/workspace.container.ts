import { ContainerModule, ContainerModuleLoadOptions } from 'inversify';

import { TYPES } from '../types';
import { WorkspaceTabLoader } from './workspace-tab-loader';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceRepository } from './workspace.repository';
import { IWorkspaceRepository } from './workspace.repository.interface';
import { WorkspaceService } from './workspace.service';
import { IWorkspaceService } from './workspace.service.interface';

export const workspaceContainerModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<IWorkspaceRepository>(TYPES.WorkspaceRepository)
      .to(WorkspaceRepository)
      .inSingletonScope();

    bind<IWorkspaceService>(TYPES.WorkspaceService)
      .to(WorkspaceService)
      .inSingletonScope();

    bind<WorkspaceController>(TYPES.WorkspaceController)
      .to(WorkspaceController)
      .inSingletonScope();

    bind<WorkspaceTabLoader>(TYPES.WorkspaceTabLoader)
      .to(WorkspaceTabLoader)
      .inSingletonScope();
  }
);
