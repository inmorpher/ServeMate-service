import { Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { Workspace, WorkspaceSchema } from './dto/workspace.dto';
import {
  IWorkspaceRepository,
  WorkspaceUpdateData,
} from './workspace.repository.interface';

@injectable()
export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  async findByUserId(userId: number): Promise<Workspace | null> {
    const workspace = await this.prisma.userWorkspace.findUnique({
      where: { userId },
    });

    return workspace ? this.toDto(workspace) : null;
  }

  async createEmpty(userId: number): Promise<Workspace> {
    const workspace = await this.prisma.userWorkspace.create({
      data: {
        userId,
        tabs: [],
        activeTabId: null,
        settings: {},
      },
    });

    return this.toDto(workspace);
  }

  async updateWithVersion(
    userId: number,
    data: WorkspaceUpdateData,
    expectedVersion: number
  ): Promise<Workspace | null> {
    const result = await this.prisma.userWorkspace.updateMany({
      where: {
        userId,
        version: expectedVersion,
      },
      data: {
        tabs: data.tabs as Prisma.InputJsonValue,
        activeTabId: data.activeTabId,
        settings: data.settings,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByUserId(userId);
  }

  private toDto(workspace: {
    tabs: Prisma.JsonValue;
    activeTabId: string | null;
    settings: Prisma.JsonValue;
    version: number;
    updatedAt: Date;
  }): Workspace {
    return WorkspaceSchema.parse({
      tabs: workspace.tabs,
      activeTabId: workspace.activeTabId,
      settings: workspace.settings,
      version: workspace.version,
      updatedAt: workspace.updatedAt.toISOString(),
    });
  }
}
