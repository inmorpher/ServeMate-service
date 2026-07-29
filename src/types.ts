import { DecodedUser } from './services/tokens/token.service.interface';

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
  // Auth
  AuthenticationController: Symbol.for('AuthenticationController'),
  ITokenService: Symbol.for('ITokenService'),
  // Tables
  TableService: Symbol.for('ITableService'),
  TableController: Symbol.for('ITableController'),
  // Orders
  OrdersService: Symbol.for('OrdersService'),
  OrdersController: Symbol.for('OrdersController'),
  // Payments
  PaymentService: Symbol.for('AbstractPaymentService'),
  PaymentController: Symbol.for('AbstractPaymentController'),
  // Reservations
  ReservationService: Symbol.for('ReservationService'),
  ReservationController: Symbol.for('ReservationController'),
  //Food items
  FoodItemsService: Symbol.for('FoodItemsService'),
  FoodItemsController: Symbol.for('FoodItemsController'),
  //Drink items
  DrinkItemsService: Symbol.for('DrinkItemsService'),
  DrinkItemsController: Symbol.for('DrinkItemsController'),
  // Base
  BaseService: Symbol.for('BaseService'),
  OrderItemsService: Symbol.for('OrderItemsService'),
  // WebSocket
  WebSocketService: Symbol.for('WebSocketService'),
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
