import { DecodedUser } from './auth/token.service.interface';

export const TYPES = {
  Application: Symbol.for('Application'),
  // Core services
  ILogger: Symbol.for('Logger'),
  PrismaClient: Symbol.for('PrismaClient'),
  // Middleware
  ExceptionFilter: Symbol.for('ExceptionFilter'),
  AuthMiddleware: Symbol.for('AuthMiddleware'),
  RoleMiddleware: Symbol.for('RoleMiddleware'),
  // Users
  UsersService: Symbol.for('UsersService'),
  UsersController: Symbol.for('UsersController'),
  UsersRepository: Symbol.for('UsersRepository'),
  // Tables
  TablesService: Symbol.for('TablesService'),
  TablesController: Symbol.for('TablesController'),
  TablesRepository: Symbol.for('TablesRepository'),
  // Auth
  AuthenticationController: Symbol.for('AuthenticationController'),
  ITokenService: Symbol.for('ITokenService'),
  AuthRepository: Symbol.for('AuthRepository'),
  AuthService: Symbol.for('AuthService'),
  // Auth
  // Orders
  OrdersService: Symbol.for('OrdersService'),
  OrdersController: Symbol.for('OrdersController'),
  OrdersRepository: Symbol.for('OrdersRepository'),
  // Payments

  PaymentsService: Symbol.for('PaymentsService'),
  PaymentsController: Symbol.for('PaymentsController'),
  PaymentsRepository: Symbol.for('PaymentsRepository'),
  // Reservations
  ReservationService: Symbol.for('ReservationService'),
  ReservationController: Symbol.for('ReservationController'),
  ReservationsService: Symbol.for('ReservationsService'),
  ReservationsController: Symbol.for('ReservationsController'),
  ReservationsRepository: Symbol.for('ReservationsRepository'),
  //Food items
  FoodItemsService: Symbol.for('FoodItemsService'),
  FoodItemsController: Symbol.for('FoodItemsController'),
  FoodItemsRepository: Symbol.for('FoodItemsRepository'),
  //Drink items
  DrinkItemsService: Symbol.for('DrinkItemsService'),
  DrinkItemsController: Symbol.for('DrinkItemsController'),
  DrinkItemsRepository: Symbol.for('DrinkItemsRepository'),
  //Workspace
  WorkspaceService: Symbol.for('WorkspaceService'),
  WorkspaceController: Symbol.for('WorkspaceController'),
  WorkspaceRepository: Symbol.for('WorkspaceRepository'),
  WorkspaceTabLoader: Symbol.for('WorkspaceTabLoader'),

  // Base
  BaseService: Symbol.for('BaseService'),
  OrderItemsService: Symbol.for('OrderItemsService'),
  // Realtime
  WebSocketService: Symbol.for('WebSocketService'),
  WebSocketGateway: Symbol.for('WebSocketGateway'),
  // Database
  DatabaseProvider: Symbol.for('DatabaseProvider'),
};

declare global {
  namespace Express {
    interface Request {
      user?: DecodedUser;
    }
  }
}
