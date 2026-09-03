import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { BaseService } from '../common/base.service';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import { publishRealtimeEvent } from '../websocket/realtime-event';
import { IWebSocketService } from '../websocket/websocket.service.interface';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceBootstrapDto } from './dto/workspace-bootstrap.dto';
import { Workspace } from './dto/workspace.dto';
import { WorkspaceTabLoader } from './workspace-tab-loader';
import { IWorkspaceRepository } from './workspace.repository.interface';
import { IWorkspaceService } from './workspace.service.interface';

@injectable()
export class WorkspaceService extends BaseService implements IWorkspaceService {
  protected serviceName = 'WorkspaceService';

  constructor(
    @inject(TYPES.WorkspaceRepository)
    private readonly workspaceRepository: IWorkspaceRepository,
    @inject(TYPES.WorkspaceTabLoader)
    private readonly workspaceTabLoader: WorkspaceTabLoader,
    @inject(TYPES.WebSocketService)
    private readonly realtimeGateway?: IWebSocketService
  ) {
    super();
  }

  async getWorkspace(userId: number): Promise<Workspace> {
    try {
      const workspace = await this.workspaceRepository.findByUserId(userId);

      if (workspace) {
        return workspace;
      }

      return await this.workspaceRepository.createEmpty(userId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBootstrap(userId: number): Promise<WorkspaceBootstrapDto> {
    try {
      const workspace = await this.getWorkspace(userId);

      const activeTab =
        workspace.tabs.find(tab => tab.id === workspace.activeTabId) ??
        workspace.tabs[0] ??
        null;

      const bootstrapWorkspace = activeTab
        ? { ...workspace, activeTabId: activeTab.id }
        : workspace;

      if (!activeTab) {
        return {
          workspace: bootstrapWorkspace,
          activeTab: null,
          activeTabData: null,
        };
      }

      const activeTabData = await this.workspaceTabLoader.load(activeTab);

      return {
        workspace: bootstrapWorkspace,
        activeTab,
        activeTabData,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateWorkspace(
    userId: number,
    data: UpdateWorkspaceDto
  ): Promise<Workspace> {
    try {
      const workspace = await this.workspaceRepository.updateWithVersion(
        userId,
        {
          tabs: data.tabs,
          activeTabId: data.activeTabId,
          settings: data.settings,
        },
        data.expectedVersion
      );

      if (workspace) {
        publishRealtimeEvent(
          this.realtimeGateway,
          'workspace',
          'updated',
          userId,
          workspace
        );
        return workspace;
      }

      const currentWorkspace =
        await this.workspaceRepository.findByUserId(userId);

      if (!currentWorkspace) {
        throw new HTTPError(404, this.serviceName, 'Workspace not found');
      }

      throw new HTTPError(
        409,
        this.serviceName,
        'Workspace was changed by another request'
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
