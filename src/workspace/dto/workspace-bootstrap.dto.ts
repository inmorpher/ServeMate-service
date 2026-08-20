import { WorkspaceTab } from './workspace-tab.dto';
import { Workspace } from './workspace.dto';

export type WorkspaceBootstrapDto = {
  workspace: Workspace;
  activeTab: WorkspaceTab | null;
  activeTabData: unknown | null;
};
