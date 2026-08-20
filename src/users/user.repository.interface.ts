import {
  CreatedUserResponse,
  UpdateUserDto,
  UserFilters,
  UserListItem,
  UserRole,
} from './dto';
import { UserPagination, UserSort } from './users.repository';

export interface IUsersRepository {
  findMany(
    filters: UserFilters,
    pagination: UserPagination,
    sort: UserSort
  ): Promise<{ users: UserListItem[]; total: number }>;

  findById(id: number): Promise<UserListItem | null>;
  findByEmail(email: string): Promise<UserListItem | null>;
  existsByEmail(email: string): Promise<boolean>;
  create(data: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
  }): Promise<CreatedUserResponse>;
  update(id: number, data: UpdateUserDto): Promise<void>;
  delete(id: number): Promise<void>;
  countActiveOrdersByServer(id: number): Promise<number>;
  verifyCredentials(
    email: string,
    password: string
  ): Promise<UserListItem | null>;
}
