import { Container, ContainerModule, interfaces } from 'inversify';
import { App } from './src/app';
import { UserController } from './src/controllers/users/users.controller';
import { ExceptionFilter } from './src/errors/exception.filter';
import { IExceptionFilter } from './src/errors/exception.filter.interface';
import { LoggerService } from './src/services/logger/logger.service';
import { ILogger } from './src/services/logger/logger.service.interface';
import { UserService } from './src/services/users/user.service';
import { TYPES } from './src/types';

export const appBindings = new ContainerModule((bind: interfaces.Bind) => {
	bind<ILogger>(TYPES.ILogger).to(LoggerService).inSingletonScope();
	bind<IExceptionFilter>(TYPES.ExceptionFilter).to(ExceptionFilter).inSingletonScope();
	bind<UserService>(TYPES.UserService).to(UserService).inSingletonScope();
	bind<UserController>(TYPES.UserController).to(UserController).inSingletonScope();
	bind<App>(TYPES.Application).to(App).inSingletonScope();
});

const bootstrap = () => {
	const appContainer = new Container();
	appContainer.load(appBindings);
	const app = appContainer.get<App>(TYPES.Application);
	app.init();

	return { app, appContainer };
};

export const { app, appContainer } = bootstrap();
