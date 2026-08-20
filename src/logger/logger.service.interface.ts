export interface ILogger {
	setContext(context: string): void;
	log(...args: unknown[]): void;
	error(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	debug(...args: unknown[]): void;
	silly(...args: unknown[]): void;
}
