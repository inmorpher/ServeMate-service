import { injectable } from 'inversify';
import 'reflect-metadata';
import { Logger } from 'tslog';
import { ILogger } from './logger.service.interface';

/**
 * LoggerService is a class that implements the ILogger interface and provides logging functionality.
 * It uses the tslog library to handle different log levels.
 */
@injectable()
export class LoggerService implements ILogger {
	/** The logger instance from tslog */
	public logger!: Logger<{}>;
	private context = 'LoggerService';
	private initCount = 0;

	/**
	 * Initializes a new instance of the LoggerService class.
	 * Sets up a new Logger with 'pretty' type.
	 */
	constructor() {
		this.initLogger();
		console.log(`Initializing LoggerService (${this.initCount})...`);
	}

	private initLogger(): void {
		if (!this.logger) {
			this.initCount++;
			this.logger = new Logger({
				type: 'pretty',
				prettyLogTimeZone: 'local',
				name: this.context,
				hideLogPositionForProduction: true,
				prettyLogTemplate:
					'{{yyyy}}-{{mm}}-{{dd}} {{hh}}:{{MM}}:{{ss}}.{{ms}}\t{{logLevelName}}\t{{name}}\t',
				prettyLogStyles: {
					logLevelName: {
						'*': ['bold', 'black', 'bgWhiteBright', 'dim'],
						SILLY: ['bold', 'white'],
						TRACE: ['bold', 'whiteBright'],
						DEBUG: ['bold', 'green'],
						INFO: ['bold', 'blue'],
						WARN: ['bold', 'yellow'],
						ERROR: ['bold', 'red'],
						FATAL: ['bold', 'redBright'],
					},
					dateIsoStr: 'white',
					filePathWithLine: 'white',
					name: ['white', 'bold', 'underline'],
					nameWithDelimiterPrefix: ['white', 'bold'],
					nameWithDelimiterSuffix: ['white', 'bold'],
					errorName: ['bold', 'bgRedBright', 'whiteBright'],
					fileName: ['yellow'],
				},
			});
		} else {
			this.logger.settings.name = this.context;
		}
	}

	public setContext(context: string): void {
		this.context = context;
		this.initLogger();
	}

	/**
	 * Logs an informational message.
	 * @param args - The arguments to be logged.
	 */
	public log(...args: unknown[]): void {
		this.logger.info(...args);
	}

	/**
	 * Logs an error message.
	 * @param args - The arguments to be logged as an error.
	 */
	public error(...args: unknown[]): void {
		this.logger.error(...args);
	}

	/**
	 * Logs a warning message.
	 * @param args - The arguments to be logged as a warning.
	 */
	public warn(...args: unknown[]): void {
		this.logger.warn(...args);
	}

	/**
	 * Logs a debug message.
	 * @param args - The arguments to be logged for debugging.
	 */
	public debug(...args: unknown[]): void {
		this.logger.debug(...args);
	}

	/**
	 * Logs a silly message (lowest priority).
	 * @param args - The arguments to be logged as silly messages.
	 */
	public silly(...args: unknown[]): void {
		this.logger.silly(...args);
	}
}
