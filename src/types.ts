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
	UserService: Symbol.for('IUserService'),
	UserController: Symbol.for('IUserController'),
	// Auth
	AuthenticationController: Symbol.for('AuthenticationController'),
	ITokenService: Symbol.for('ITokenService'),
	// Tables
	//TODO : Add types for TableController and TableService
	TableService: Symbol.for('ITableService'),
	TableController: Symbol.for('ITableController'),
	// Orders
	OrdersService: Symbol.for('OrdersService'),
	OrdersController: Symbol.for('OrdersController'),
	// Base
	BaseService: Symbol.for('BaseService'),
};

declare global {
	namespace Express {
		interface Request {
			user?: DecodedUser;
		}
	}
}
