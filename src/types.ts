export const TYPES = {
	Application: Symbol.for('Application'),
	ILogger: Symbol.for('Logger'),
	ExceptionFilter: Symbol.for('ExceptionFilter'),
	AuthMiddleware: Symbol.for('AuthMiddleware'),
	IControllerRoute: Symbol.for('IControllerRoute'),
	UserController: Symbol.for('UserController'),
	AuthenticationController: Symbol.for('AuthenticationController'),
	UserService: Symbol.for('UserService'),
	PrismaClient: Symbol.for('PrismaClient'),
};
