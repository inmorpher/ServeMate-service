import { WorkspaceSettings } from './dto/workspace-settings.dto';
import { WorkspaceTab } from './dto/workspace-tab.dto';
import { Workspace } from './dto/workspace.dto';

export type WorkspaceUpdateData = {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  settings: WorkspaceSettings;
};

export interface IWorkspaceRepository {
  findByUserId(userId: number): Promise<Workspace | null>;
  createEmpty(userId: number): Promise<Workspace>;
  updateWithVersion(
    userId: number,
    data: WorkspaceUpdateData,
    expectedVersion: number
  ): Promise<Workspace | null>;
}
