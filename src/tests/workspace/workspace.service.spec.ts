import { HTTPError } from '../../errors/http-error.class';
import { IWebSocketService } from '../../websocket/websocket.service.interface';
import { UpdateWorkspaceDto } from '../../workspace/dto/update-workspace.dto';
import { WorkspaceBootstrapDto } from '../../workspace/dto/workspace-bootstrap.dto';
import { WorkspaceTab } from '../../workspace/dto/workspace-tab.dto';
import { Workspace } from '../../workspace/dto/workspace.dto';
import { WorkspaceTabLoader } from '../../workspace/workspace-tab-loader';
import { IWorkspaceRepository } from '../../workspace/workspace.repository.interface';
import { WorkspaceService } from '../../workspace/workspace.service';

const repositoryMock = (): jest.Mocked<IWorkspaceRepository> =>
  ({
    findByUserId: jest.fn(),
    createEmpty: jest.fn(),
    updateWithVersion: jest.fn(),
  }) as jest.Mocked<IWorkspaceRepository>;

const tabLoaderMock = (): jest.Mocked<WorkspaceTabLoader> =>
  ({ load: jest.fn() }) as unknown as jest.Mocked<WorkspaceTabLoader>;

const realtimeGatewayMock = (): jest.Mocked<IWebSocketService> =>
  ({
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    publish: jest.fn(),
    getActiveSubscribers: jest.fn(),
  }) as jest.Mocked<IWebSocketService>;

const tab = (overrides: Partial<WorkspaceTab> = {}): WorkspaceTab => ({
  id: 'users-tab',
  title: 'Users',
  type: 'users',
  state: {},
  order: 0,
  ...overrides,
});

const workspace = (overrides: Partial<Workspace> = {}): Workspace => ({
  tabs: [tab()],
  activeTabId: 'users-tab',
  settings: { theme: 'light' },
  version: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const update = (
  overrides: Partial<UpdateWorkspaceDto> = {}
): UpdateWorkspaceDto => ({
  tabs: [tab()],
  activeTabId: 'users-tab',
  settings: { theme: 'dark' },
  expectedVersion: 1,
  ...overrides,
});

describe('WorkspaceService', () => {
  let repository: jest.Mocked<IWorkspaceRepository>;
  let tabLoader: jest.Mocked<WorkspaceTabLoader>;
  let realtimeGateway: jest.Mocked<IWebSocketService>;
  let service: WorkspaceService;

  beforeEach(() => {
    repository = repositoryMock();
    tabLoader = tabLoaderMock();
    realtimeGateway = realtimeGatewayMock();
    service = new WorkspaceService(repository, tabLoader, realtimeGateway);
  });

  it('returns an existing workspace', async () => {
    const current = workspace();
    repository.findByUserId.mockResolvedValue(current);

    await expect(service.getWorkspace(7)).resolves.toBe(current);
    expect(repository.createEmpty).not.toHaveBeenCalled();
  });

  it('creates an empty workspace when none exists', async () => {
    const created = workspace({ tabs: [], activeTabId: null });
    repository.findByUserId.mockResolvedValue(null);
    repository.createEmpty.mockResolvedValue(created);

    await expect(service.getWorkspace(7)).resolves.toBe(created);
    expect(repository.createEmpty).toHaveBeenCalledWith(7);
  });

  it('loads the active tab during bootstrap', async () => {
    const current = workspace();
    const activeTabData = { users: [{ id: 1 }] };
    repository.findByUserId.mockResolvedValue(current);
    tabLoader.load.mockResolvedValue(activeTabData);

    await expect(service.getBootstrap(7)).resolves.toEqual({
      workspace: current,
      activeTab: current.tabs[0],
      activeTabData,
    } satisfies WorkspaceBootstrapDto);
    expect(tabLoader.load).toHaveBeenCalledWith(current.tabs[0]);
  });

  it('falls back to the first tab when activeTabId is invalid', async () => {
    const current = workspace({ activeTabId: 'missing-tab' });
    repository.findByUserId.mockResolvedValue(current);
    tabLoader.load.mockResolvedValue([]);

    await expect(service.getBootstrap(7)).resolves.toEqual(
      expect.objectContaining({
        workspace: expect.objectContaining({ activeTabId: 'users-tab' }),
        activeTab: current.tabs[0],
      })
    );
  });

  it('returns null active data for an empty workspace', async () => {
    const current = workspace({ tabs: [], activeTabId: null });
    repository.findByUserId.mockResolvedValue(current);

    await expect(service.getBootstrap(7)).resolves.toEqual({
      workspace: current,
      activeTab: null,
      activeTabData: null,
    });
    expect(tabLoader.load).not.toHaveBeenCalled();
  });

  it('updates the workspace using the expected version', async () => {
    const updated = workspace({ version: 2 });
    repository.updateWithVersion.mockResolvedValue(updated);

    await expect(service.updateWorkspace(7, update())).resolves.toBe(updated);
    expect(repository.updateWithVersion).toHaveBeenCalledWith(
      7,
      {
        tabs: update().tabs,
        activeTabId: 'users-tab',
        settings: { theme: 'dark' },
      },
      1
    );
    expect(realtimeGateway.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: 'workspace',
        type: 'workspace.updated',
        entityId: 7,
        payload: {
          version: 2,
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      })
    );
    expect(realtimeGateway.publish.mock.calls[0][0].payload).not.toEqual(
      updated
    );
  });

  it('returns a conflict when the workspace version is stale', async () => {
    repository.updateWithVersion.mockResolvedValue(null);
    repository.findByUserId.mockResolvedValue(workspace({ version: 2 }));

    await expect(service.updateWorkspace(7, update())).rejects.toMatchObject({
      statusCode: 409,
      message: 'Workspace was changed by another request',
    });
  });

  it('returns not found when a version conflict has no workspace', async () => {
    repository.updateWithVersion.mockResolvedValue(null);
    repository.findByUserId.mockResolvedValue(null);

    await expect(service.updateWorkspace(7, update())).rejects.toMatchObject({
      statusCode: 404,
      message: 'Workspace not found',
    });
  });

  it('wraps repository failures as HTTPError', async () => {
    repository.findByUserId.mockRejectedValue(new Error('database down'));

    await expect(service.getWorkspace(7)).rejects.toBeInstanceOf(HTTPError);
  });
});
