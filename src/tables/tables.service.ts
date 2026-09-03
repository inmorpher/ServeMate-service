import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BaseService } from '../common/base.service';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../types';
import { publishRealtimeEvent } from '../websocket/realtime-event';
import { IWebSocketService } from '../websocket/websocket.service.interface';
import {
  TableAssignmentDto,
  TableCreateDto,
  TableDto,
  TableListResponse,
  TableQueryDto,
  TableSortColumn,
  TableUpdateDto,
} from './dto';
import { ITablesRepository } from './tables.repository.interface';
import { ITablesService } from './tables.service.interface';

@injectable()
export class TablesService extends BaseService implements ITablesService {
  protected serviceName = 'TablesService';

  constructor(
    @inject(TYPES.TablesRepository) private tablesRepository: ITablesRepository,
    @inject(TYPES.WebSocketService)
    private readonly realtimeGateway?: IWebSocketService
  ) {
    super();
  }

  async findTables(criteria: TableQueryDto): Promise<TableListResponse> {
    try {
      const sortBy = Object.values(TableSortColumn).includes(criteria.sortBy)
        ? criteria.sortBy
        : TableSortColumn.ID;
      const { tables, total } = await this.tablesRepository.findMany(
        criteria,
        { page: criteria.page, pageSize: criteria.pageSize },
        { sortBy, sortOrder: criteria.sortOrder }
      );

      return {
        tables,
        totalCount: total,
        page: criteria.page,
        pageSize: criteria.pageSize,
        totalPages: Math.ceil(total / criteria.pageSize),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async findTableById(id: number): Promise<TableDto | null> {
    try {
      return await this.tablesRepository.findById(id);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createTable(data: TableCreateDto): Promise<TableDto> {
    try {
      if (await this.tablesRepository.findByTableNumber(data.tableNumber)) {
        throw new HTTPError(
          400,
          this.serviceName,
          `Table with number ${data.tableNumber} already exists`
        );
      }
      const table = await this.tablesRepository.create(data);
      publishRealtimeEvent(
        this.realtimeGateway,
        'tables',
        'created',
        table.id,
        table
      );
      return table;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateTable(id: number, data: TableUpdateDto): Promise<TableDto> {
    try {
      const current = await this.tablesRepository.findById(id);
      if (!current) {
        throw new HTTPError(404, this.serviceName, 'Table not found');
      }

      if (
        data.tableNumber !== undefined &&
        data.tableNumber !== current.tableNumber &&
        (await this.tablesRepository.findByTableNumber(data.tableNumber))
      ) {
        throw new HTTPError(
          400,
          this.serviceName,
          `Table with number ${data.tableNumber} already exists`
        );
      }

      const table = await this.tablesRepository.update(id, data);
      publishRealtimeEvent(
        this.realtimeGateway,
        'tables',
        'updated',
        table.id,
        table
      );
      return table;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteTable(id: number): Promise<void> {
    try {
      const table = await this.tablesRepository.findById(id);
      if (!table) {
        throw new HTTPError(404, this.serviceName, 'Table not found');
      }
      await this.tablesRepository.delete(id);
      publishRealtimeEvent(this.realtimeGateway, 'tables', 'deleted', id);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async assignTables(data: TableAssignmentDto): Promise<void> {
    try {
      await this.tablesRepository.assignTables(data);
      publishRealtimeEvent(
        this.realtimeGateway,
        'tables',
        'assigned',
        undefined,
        data
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
