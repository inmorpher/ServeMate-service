import * as fs from 'fs/promises';
import { injectable } from 'inversify';
import path from 'path';
import 'reflect-metadata';
import { Logger } from 'tslog';
import { ENV } from '../../../env';
import { ILogger } from './logger.service.interface';

enum LogLevel {
	SILLY = 'SILLY',
	TRACE = 'TRACE',
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR',
	FATAL = 'FATAL',
}

const logColors = {
	[LogLevel.SILLY]: '\x1b[37m', // white
	[LogLevel.TRACE]: '\x1b[37m', // white
	[LogLevel.DEBUG]: '\x1b[32m', // green
	[LogLevel.INFO]: '\x1b[34m', // blue
	[LogLevel.WARN]: '\x1b[33m', // yellow
	[LogLevel.ERROR]: '\x1b[31m', // red
	[LogLevel.FATAL]: '\x1b[35m', // magenta
};

@injectable()
export class LoggerService implements ILogger {
	private logger: Logger<{}> | null = null;
	private context = '';
	private logToFile: boolean;
	private logFilePath: string;

	/**
	 * Initializes a new instance of the LoggerService.
	 * Sets up the logging configuration, including file logging if enabled.
	 */
	constructor() {
		this.logToFile = ENV.LOG_TO_FILE;
		const logsDir = path.join(__dirname, '../../../logs');
		const now = new Date();
		const formattedDateTime = now
			.toLocaleString('en-US', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			})
			.replace(/[/,:\s]/g, '-');
		this.logFilePath = path.join(logsDir, `app_${formattedDateTime}.log`);

		this.ensureLogDirectory(logsDir);
	}

	/**
	 * Ensures that the specified log directory exists.
	 * If the directory doesn't exist, it creates it recursively.
	 * If creation fails, it disables file logging.
	 *
	 * @param dir - The path of the directory to ensure exists
	 * @returns A promise that resolves when the operation is complete
	 * @throws Will not throw, but logs errors to console and disables file logging on failure
	 */
	private async ensureLogDirectory(dir: string): Promise<void> {
		try {
			await fs.mkdir(dir, { recursive: true });
		} catch (error) {
			console.error(`Failed to create log directory: ${error}`);
			this.logToFile = false;
		}
	}

	/**
	 * Retrieves or initializes the logger instance.
	 *
	 * This method creates a new Logger instance if one doesn't exist, configuring it
	 * with pretty logging settings and custom styles. If file logging is enabled,
	 * it also attaches a transport to write logs to a file.
	 *
	 * @returns {Logger<{}>} The configured Logger instance.
	 */
	private getLogger(): Logger<{}> {
		if (!this.logger) {
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

			if (this.logToFile) {
				this.logger.attachTransport(async (logObj) => {
					const timestamp = new Date().toLocaleString('en-US', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
						hour12: false,
					});
					const level = logObj._meta.logLevelName as LogLevel;
					const context = logObj._meta.name;
					const message = logObj[0];

					const formattedLog = `${timestamp} ${logColors[level]}[${level}]\x1b[0m \x1b[1m${context}:\x1b[0m ${message}\n`;
					await fs.appendFile(this.logFilePath, formattedLog);
				});
			}
		}
		return this.logger;
	}

	/**
	 * Sets a new context for the logger.
	 *
	 * This method updates the context of the logger, which is typically used to identify
	 * the source or category of log messages. If a logger instance already exists,
	 * it also updates the name setting of the logger to reflect the new context.
	 *
	 * @param context - A string representing the new context for the logger.
	 *                  This value will be used to identify the source of subsequent log messages.
	 *
	 * @returns void This method doesn't return a value.
	 */

	/**
	 * Sets a new context for the logger.
	 *
	 * This method updates the context of the logger, which is typically used to identify
	 * the source or category of log messages. If a logger instance already exists,
	 * it also updates the name setting of the logger to reflect the new context.
	 *
	 * @param context - A string representing the new context for the logger.
	 *                  This value will be used to identify the source of subsequent log messages.
	 *
	 * @returns void This method doesn't return a value.
	 */
	public setContext(context: string): void {
		this.context = context;
		if (this.logger) {
			this.logger.settings.name = this.context;
		}
	}

	/**
	 * Logs an informational message.
	 *
	 * This method logs a message at the 'info' level using the underlying logger.
	 * It can accept any number of arguments of any type, which will be passed directly
	 * to the logger's info method.
	 *
	 * @param {...unknown[]} args - The arguments to log. These can be of any type and any number.
	 *                              All arguments will be passed through to the underlying logger.
	 *
	 * @returns {void} This method does not return a value.
	 */
	public log(...args: unknown[]): void {
		this.getLogger().info(...args);
	}

	/**
	 * Logs an error message.
	 *
	 * This method logs a message at the 'error' level using the underlying logger.
	 * It can accept any number of arguments of any type, which will be passed directly
	 * to the logger's error method.
	 *
	 * @param {...unknown[]} args - The arguments to log. These can be of any type and any number.
	 *                              All arguments will be passed through to the underlying logger.
	 *
	 * @returns {void} This method does not return a value.
	 */
	public error(...args: unknown[]): void {
		this.getLogger().error(...args);
	}

	/**
	 * Logs a warning message.
	 *
	 * This method logs a message at the 'warn' level using the underlying logger.
	 * It can accept any number of arguments of any type, which will be passed directly
	 * to the logger's warn method.
	 *
	 * @param {...unknown[]} args - The arguments to log. These can be of any type and any number.
	 *                              All arguments will be passed through to the underlying logger.
	 *
	 * @returns {void} This method does not return a value.
	 */
	public warn(...args: unknown[]): void {
		this.getLogger().warn(...args);
	}

	/**
	 * Logs a debug message.
	 *
	 * This method logs a message at the 'debug' level using the underlying logger.
	 * It can accept any number of arguments of any type, which will be passed directly
	 * to the logger's debug method.
	 *
	 * @param {...unknown[]} args - The arguments to log. These can be of any type and any number.
	 *                              All arguments will be passed through to the underlying logger.
	 *
	 * @returns {void} This method does not return a value.
	 */
	public debug(...args: unknown[]): void {
		this.getLogger().debug(...args);
	}

	/**
	 * Logs a silly message.
	 *
	 * This method logs a message at the 'silly' level using the underlying logger.
	 * It can accept any number of arguments of any type, which will be passed directly
	 * to the logger's silly method. The 'silly' level is typically used for the most
	 * verbose logging, often only enabled during detailed debugging sessions.
	 *
	 * @param {...unknown[]} args - The arguments to log. These can be of any type and any number.
	 *                              All arguments will be passed through to the underlying logger.
	 *
	 * @returns {void} This method does not return a value.
	 */
	public silly(...args: unknown[]): void {
		this.getLogger().silly(...args);
	}
}
