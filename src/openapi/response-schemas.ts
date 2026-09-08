import { z } from 'zod';
import {
  drinkItemSchema,
  drinkItemsListSchema,
} from '../drink-items/dto/drink-base.dto';
import {
  foodItemSchema,
  foodItemsListSchema,
} from '../food-items/dto/food-base.dto';
import { OrderMetaSchema } from '../orders/dto/order-meta.dto';
import {
  OrderResponseSchema,
  OrderSearchResultSchema,
} from '../orders/dto/order-response.dto';
import { PaymentSchema } from '../payments/dto/payment-base.dto';
import {
  ReservationSchema,
  ReservationTableSchema,
} from '../reservations/dto/reservation-base.dto';
import { TableSchema } from '../tables/dto/table-base.dto';
import { UserResponseSchema } from '../users/dto/user-base.dto';
import { WorkspaceTabSchema } from '../workspace/dto/workspace-tab.dto';
import { WorkspaceSchema } from '../workspace/dto/workspace.dto';

export const ErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  error: z.string(),
});

export const MessageResponseSchema = z.object({ message: z.string() });
export const TokenPairResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().nonnegative(),
});
export const LoginResponseSchema = TokenPairResponseSchema.extend({
  user: UserResponseSchema,
});
export const MeResponseSchema = z.object({ user: UserResponseSchema });
export const UsersListResponseSchema = z.object({
  users: z.array(UserResponseSchema),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export const WorkspaceBootstrapResponseSchema = z.object({
  workspace: WorkspaceSchema,
  activeTab: WorkspaceTabSchema.nullable(),
  activeTabData: z.unknown().nullable(),
});

export const FoodItemsResponseSchema = foodItemsListSchema;
export const DrinkItemsResponseSchema = drinkItemsListSchema;
export const OrdersResponseSchema = OrderSearchResultSchema;
export const OrderMetaResponseSchema = OrderMetaSchema;
export const PaymentsListResponseSchema = z.object({
  payments: z.array(PaymentSchema),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});
export const ReservationConflictSchema = z.object({
  reservationId: z.number().int().positive(),
  time: z.date(),
  tables: z.array(ReservationTableSchema),
});
export const ReservationMutationResponseSchema = z.object({
  reservation: ReservationSchema,
  conflict: z.array(ReservationConflictSchema),
});
export const ReservationsListResponseSchema = z.object({
  list: z.array(ReservationSchema),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});
export const TablesListResponseSchema = z.object({
  tables: z.array(TableSchema),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});
export const TableAssignmentResponseSchema = z.string();

export const ApiResponseSchemas = {
  AuthenticationController_login: LoginResponseSchema,
  AuthenticationController_logout: MessageResponseSchema,
  AuthenticationController_refreshToken: TokenPairResponseSchema,
  AuthenticationController_me: MeResponseSchema,
  UserController_findAll: UsersListResponseSchema,
  UserController_findOne: UserResponseSchema,
  UserController_create: UserResponseSchema,
  UserController_delete: MessageResponseSchema,
  UserController_update: MessageResponseSchema,
  WorkspaceController_get: WorkspaceSchema,
  WorkspaceController_getBootstrap: WorkspaceBootstrapResponseSchema,
  WorkspaceController_update: WorkspaceSchema,
  OrdersController_findOrders: OrdersResponseSchema,
  OrdersController_getOrderMeta: OrderMetaResponseSchema,
  OrdersController_findOrderById: OrderResponseSchema,
  FoodItemsController_create: foodItemSchema,
  FoodItemsController_findAll: FoodItemsResponseSchema,
  FoodItemsController_findOne: foodItemSchema,
  FoodItemsController_update: foodItemSchema,
  DrinkItemsController_create: drinkItemSchema,
  DrinkItemsController_findAll: DrinkItemsResponseSchema,
  DrinkItemsController_findOne: drinkItemSchema,
  DrinkItemsController_update: drinkItemSchema,
  ReservationsController_create: ReservationMutationResponseSchema,
  ReservationsController_findAll: ReservationsListResponseSchema,
  ReservationsController_findOne: ReservationSchema,
  ReservationsController_update: ReservationMutationResponseSchema,
  ReservationsController_updateStatus: ReservationMutationResponseSchema,
  ReservationsController_updateTime: ReservationMutationResponseSchema,
  ReservationsController_updateTables: ReservationMutationResponseSchema,
  ReservationsController_updateGuestInfo: ReservationMutationResponseSchema,
  ReservationsController_updateComment: ReservationMutationResponseSchema,
  ReservationsController_delete: MessageResponseSchema,
  TablesController_findAll: TablesListResponseSchema,
  TablesController_assign: TableAssignmentResponseSchema,
  TablesController_findOne: TableSchema,
  TablesController_update: TableSchema,
  PaymentsController_findAll: PaymentsListResponseSchema,
  PaymentsController_findOne: PaymentSchema,
  PaymentsController_create: PaymentSchema,
  PaymentsController_complete: PaymentSchema,
  PaymentsController_refund: PaymentSchema,
  PaymentsController_cancel: PaymentSchema,
} as const;

export type ApiResponseName = keyof typeof ApiResponseSchemas;
