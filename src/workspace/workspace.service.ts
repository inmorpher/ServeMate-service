import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { BaseService } from '../common/base.service';
import { HTTPError } from '../errors/http-error.class';
import { OrderQuerySchema } from '../orders/dto/order-query.dto';
import { IOrdersService } from '../orders/orders.service.interface';
import { TableQuerySchema } from '../tables/dto/table-query.dto';
import { ITablesService } from '../tables/tables.service.interface';
import { TYPES } from '../types';
import { UserQuerySchema } from '../users/dto/user-query.dto';
import { IUsersService } from '../users/users.service.interface';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceBootstrapDto } from './dto/workspace-bootstrap.dto';
import { WorkspaceTab } from './dto/workspace-tab.dto';
import { Workspace } from './dto/workspace.dto';
import { IWorkspaceRepository } from './workspace.repository.interface';
import { IWorkspaceService } from './workspace.service.interface';

@injectable()
export class WorkspaceService extends BaseService implements IWorkspaceService {
  protected serviceName = 'WorkspaceService';

  private readonly tabLoaders: Record<
    string,
    (state: Record<string, unknown>) => Promise<unknown>
  > = {
    users: async state => {
      const query = UserQuerySchema.parse(state);
      return this.usersService.findUsers(query);
    },
    orders: async state => {
      const query = OrderQuerySchema.parse(state);
      return this.ordersService.findOrders(query);
    },
    tables: async state => {
      const query = TableQuerySchema.parse(state);
      return this.tablesService.findTables(query);
    },
  };

  constructor(
    @inject(TYPES.WorkspaceRepository)
    private readonly workspaceRepository: IWorkspaceRepository,

    @inject(TYPES.OrdersService)
    private readonly ordersService: IOrdersService,

    @inject(TYPES.TablesService)
    private readonly tablesService: ITablesService,

    @inject(TYPES.UsersService)
    private readonly usersService: IUsersService
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

      const activeTabData = await this.loadActiveTabData(userId, activeTab);

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

  private async loadActiveTabData(
    _userId: number,
    activeTab: WorkspaceTab
  ): Promise<unknown | null> {
    const loader = this.tabLoaders[activeTab.type];

    if (!loader) {
      return null;
    }

    return loader(activeTab.state ?? {});
  }
}
