import { UserRole } from '@prisma/client';
import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseController } from '../common/base.controller';
import { TypedRequest } from '../common/route.interface';
import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
} from '../decorators/httpDecorators';
import { Roles } from '../decorators/Roles';
import { ILogger } from '../logger/logger.service.interface';
import { Validate } from '../middleware/validate/validate.middleware';
import { TYPES } from '../types';
import {
  TableAssignmentDto,
  TableAssignmentSchema,
  TableCreateDto,
  TableCreateSchema,
  TableListResponse,
  TableParamsDto,
  TableParamsSchema,
  TableQueryDto,
  TableQuerySchema,
  TableUpdateDto,
  TableUpdateSchema,
} from './dto';
import { ITablesService } from './tables.service.interface';

export type TablesControllerService = Pick<
  ITablesService,
  | 'findTables'
  | 'findTableById'
  | 'createTable'
  | 'updateTable'
  | 'deleteTable'
  | 'assignTables'
>;

@injectable()
@Controller('/tables')
export class TablesController extends BaseController {
  constructor(
    @inject(TYPES.ILogger) loggerService: ILogger,
    @inject(TYPES.TablesService) private tablesService: TablesControllerService
  ) {
    super(loggerService);
  }

  @Validate(TableQuerySchema, 'query')
  @Get('/')
  async findAll(
    req: TypedRequest<{}, TableQueryDto, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = this.getValidated(req, 'query');
      const result: TableListResponse =
        await this.tablesService.findTables(query);
      this.ok(res, result);
    } catch (error) {
      next(error);
    }
  }

  @Validate(TableAssignmentSchema, 'body')
  @Post('/assign')
  @Roles([UserRole.ADMIN, UserRole.MANAGER])
  async assign(
    req: TypedRequest<{}, {}, TableAssignmentDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = this.getValidated(req, 'body');
      await this.tablesService.assignTables(data);
      this.ok(
        res,
        `Tables ${data.assignedTables.join(', ')} assigned to server ${data.serverId} successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  @Validate(TableParamsSchema, 'params')
  @Get('/:id')
  async findOne(
    req: TypedRequest<TableParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = this.getValidated(req, 'params');
      const table = await this.tablesService.findTableById(id);
      if (!table) {
        this.notFound(res, 'Table not found');
        return;
      }
      this.ok(res, table);
    } catch (error) {
      next(error);
    }
  }

  @Validate(TableCreateSchema, 'body')
  @Post('/')
  async create(
    req: TypedRequest<{}, {}, TableCreateDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const table = await this.tablesService.createTable(
        this.getValidated(req, 'body')
      );
      this.created(res);
    } catch (error) {
      next(error);
    }
  }

  @Validate(TableUpdateSchema, 'body')
  @Validate(TableParamsSchema, 'params')
  @Put('/:id')
  async update(
    req: TypedRequest<TableParamsDto, {}, TableUpdateDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = this.getValidated(req, 'params');
      const table = await this.tablesService.updateTable(
        id,
        this.getValidated(req, 'body')
      );
      this.ok(res, table);
    } catch (error) {
      next(error);
    }
  }

  @Validate(TableParamsSchema, 'params')
  @Delete('/:id')
  async delete(
    req: TypedRequest<TableParamsDto, {}, {}>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = this.getValidated(req, 'params');
      await this.tablesService.deleteTable(id);
      this.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}
