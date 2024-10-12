export const TYPES = {
	Application: Symbol.for('Application'),
	// Core services
	ILogger: Symbol.for('Logger'),
	PrismaClient: Symbol.for('PrismaClient'),
	// Middleware
	ExceptionFilter: Symbol.for('ExceptionFilter'),
	AuthMiddleware: Symbol.for('AuthMiddleware'),
	// Users
	UserService: Symbol.for('IUserService'),
	UserController: Symbol.for('IUserController'),
	// Auth
	AuthenticationController: Symbol.for('AuthenticationController'),
	ITokenService: Symbol.for('ITokenService'),
};
