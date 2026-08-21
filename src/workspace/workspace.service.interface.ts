import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceBootstrapDto } from './dto/workspace-bootstrap.dto';
import { Workspace } from './dto/workspace.dto';

export interface IWorkspaceService {
  getWorkspace(userId: number): Promise<Workspace>;

  getBootstrap(userId: number): Promise<WorkspaceBootstrapDto>;

  updateWorkspace(userId: number, data: UpdateWorkspaceDto): Promise<Workspace>;
}
