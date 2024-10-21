import { PrismaClient } from '@prisma/client';
import { Container, ContainerModule, interfaces } from 'inversify';
import { App } from './src/app';
import { AuthenticationController } from './src/controllers/auth/auth.controller';
import { IUserController } from './src/controllers/users/user.controller.interface';
import { UserController } from './src/controllers/users/users.controller';
import { ExceptionFilter } from './src/errors/exception.filter';
import { IExceptionFilter } from './src/errors/exception.filter.interface';
import { AuthMiddleware } from './src/middleware/auth/auth.middleware';
import { RoleMiddleware } from './src/middleware/role/role.middleware';
import { LoggerService } from './src/services/logger/logger.service';
import { ILogger } from './src/services/logger/logger.service.interface';
import { TokenService } from './src/services/tokens/token.service';
import { ITokenService } from './src/services/tokens/token.service.interface';
import { UserService } from './src/services/users/user.service';
import { IUserService } from './src/services/users/user.service.interface';
import { TYPES } from './src/types';

export const coreServicesModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<ILogger>(TYPES.ILogger).to(LoggerService).inSingletonScope();
	bind<IExceptionFilter>(TYPES.ExceptionFilter).to(ExceptionFilter).inSingletonScope();
	bind<ITokenService>(TYPES.ITokenService).to(TokenService).inSingletonScope();
	bind<RoleMiddleware>(TYPES.RoleMiddleware).to(RoleMiddleware).inSingletonScope();
	bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());
});

export const authModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware).inSingletonScope();
	bind<AuthenticationController>(TYPES.AuthenticationController)
		.to(AuthenticationController)
		.inSingletonScope();
});

export const userModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<IUserService>(TYPES.UserService).to(UserService).inSingletonScope();
	bind<IUserController>(TYPES.UserController).to(UserController).inSingletonScope();
});

export const appModule = new ContainerModule((bind: interfaces.Bind) => {
	bind<App>(TYPES.Application).to(App).inSingletonScope();
});

export const appBindings = [coreServicesModule, authModule, userModule, appModule];

const bootstrap = () => {
	const appContainer = new Container();
	appContainer.load(...appBindings);
	const app = appContainer.get<App>(TYPES.Application);
	app.init();

	return { app, appContainer };
};

export const { app, appContainer } = bootstrap();
