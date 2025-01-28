import { Request } from 'express';
import 'reflect-metadata';

export function Body(paramName?: string) {
	return function (target: Object, propertyKey: string | symbol, parameterIndex: number): void {
		const originalMethod = target[propertyKey as keyof typeof target];

		Object.defineProperty(target, propertyKey, {
			value: function (this: unknown, ...args: any[]) {
				const req = args[0] as Request;

				if (!req.body) {
					throw new Error('Request body is undefined');
				}

				if (paramName && paramName in req.body) {
					args[parameterIndex] = req.body[paramName];
				} else if (paramName) {
					console.warn(`Parameter ${paramName} not found in request body`);
					args[parameterIndex] = undefined;
				}

				return Reflect.apply(originalMethod as Function, this, args);
			},
			configurable: true,
			writable: true,
		});
	};
}
