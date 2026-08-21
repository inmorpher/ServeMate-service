import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { BaseController } from '../common/base.controller';
import { TypedRequest } from '../common/route.interface';
import { Controller, Get, Put } from '../decorators/httpDecorators';
import { ILogger } from '../logger/logger.service.interface';
import { Validate } from '../middleware/validate/validate.middleware';
import { TYPES } from '../types';
import {
  UpdateWorkspaceDto,
  UpdateWorkspaceSchema,
} from './dto/update-workspace.dto';
import { Workspace } from './dto/workspace.dto';
import { IWorkspaceService } from './workspace.service.interface';

@injectable()
@Controller('/workspace')
export class WorkspaceController extends BaseController {
  constructor(
    @inject(TYPES.ILogger) logger: ILogger,
    @inject(TYPES.WorkspaceService)
    private readonly workspaceService: IWorkspaceService
  ) {
    super(logger);
  }

  @Get('/')
  async get(
    req: TypedRequest<{}, {}, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        this.unauthorized(res);
        return;
      }

      const workspace: Workspace = await this.workspaceService.getWorkspace(
        req.user.id
      );

      this.ok(res, workspace);
    } catch (error) {
      next(error);
    }
  }

  @Get('/bootstrap')
  async getBootstrap(
    req: TypedRequest<{}, {}, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        this.unauthorized(res);
        return;
      }

      const bootstrapData = await this.workspaceService.getBootstrap(
        req.user.id
      );

      this.ok(res, bootstrapData);
    } catch (error) {
      next(error);
    }
  }

  @Validate(UpdateWorkspaceSchema, 'body')
  @Put('/')
  async update(
    req: TypedRequest<{}, {}, UpdateWorkspaceDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        this.unauthorized(res);
        return;
      }

      const data = this.getValidated(req, 'body');

      const workspace = await this.workspaceService.updateWorkspace(
        req.user.id,
        data
      );

      this.ok(res, workspace);
    } catch (error) {
      next(error);
    }
  }
}
