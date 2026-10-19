import {
  TableAssignmentDto,
  TableCreateDto,
  TableDto,
  TableListResponse,
  TableMetaDto,
  TableQueryDto,
  TableUpdateDto,
} from './dto';

export interface ITablesService {
  getMeta(): Promise<TableMetaDto>;
  findTables(criteria: TableQueryDto): Promise<TableListResponse>;
  findTableById(id: number): Promise<TableDto | null>;
  createTable(data: TableCreateDto): Promise<TableDto>;
  updateTable(id: number, data: TableUpdateDto): Promise<TableDto>;
  deleteTable(id: number): Promise<void>;
  assignTables(data: TableAssignmentDto): Promise<void>;
}
