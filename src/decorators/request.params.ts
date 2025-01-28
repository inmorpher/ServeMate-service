import { Request } from 'express';

// Декоратор для параметров из body
export function Body(paramName?: string) {
	return createParamDecorator((req: Request) => (paramName ? req.body[paramName] : req.body));
}

// Декоратор для query параметров
export function Query(paramName?: string) {
	return createParamDecorator((req: Request) => (paramName ? req.query[paramName] : req.query));
}

// Декоратор для route параметров
export function Param(paramName?: string) {
	return createParamDecorator((req: Request) => (paramName ? req.params[paramName] : req.params));
}

// Базовая функция для создания декораторов
function createParamDecorator(handler: (req: Request) => any) {
	return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
		const originalMethod = target[propertyKey as keyof typeof target];

		Object.defineProperty(target, propertyKey, {
			value: function (this: any, ...args: any[]) {
				// Находим первый аргумент типа Request
				const reqIndex = args.findIndex(
					(arg) => arg && typeof arg === 'object' && 'body' in arg && !('_readableState' in arg)
				);

				if (reqIndex === -1) throw new Error('Request object not found');

				const req = args[reqIndex];
				// Получаем только нужные данные через handler
				const value = handler(req);

				// Устанавливаем значение в нужную позицию
				args[parameterIndex] = value;

				return Reflect.apply(originalMethod as Function, this, args);
			},
			configurable: true,
			writable: true,
		});
	};
}
