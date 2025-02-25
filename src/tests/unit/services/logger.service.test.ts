import 'reflect-metadata';
import { Logger } from 'tslog';
import { LoggerService } from '../../../services/logger/logger.service';

// Mock tslog module
jest.mock('tslog', () => {
    const originalModule = jest.requireActual('tslog');
    return {
        ...originalModule,
        Logger: class extends originalModule.Logger {
            constructor(settings: any) {
                super(settings);
                // Override the transportFormatted function to prevent console output
                this.settings.transportFormatted = jest.fn();
            }
        }
    };
});

jest.mock('../../../../env', () => ({
    ENV: {
        LOG_TO_FILE: true,
    },
}));

describe('LoggerService', () => {
	let loggerService: LoggerService;
	let mockMkdir: jest.Mock;
	let mockAppendFile: jest.Mock;

	beforeEach(async () => {
		jest.clearAllMocks();

		mockMkdir = jest.fn().mockResolvedValue(undefined);
		mockAppendFile = jest.fn().mockResolvedValue(undefined);

		jest.mock('fs/promises', () => ({
			mkdir: mockMkdir,
			appendFile: mockAppendFile,
		}));

		jest.mock('path', () => ({
			join: jest.fn().mockImplementation((...args) => args.join('/')),
		}));

		// Reset modules to ensure new mocks are used
		jest.resetModules();

		const LoggerServiceModule = await import('../../../services/logger/logger.service');
		loggerService = new LoggerServiceModule.LoggerService();

		// Wait for the directory creation to complete
		await new Promise(process.nextTick);
	});

	it('should create a log directory when initialized', async () => {
		expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true });
	});

	it('should create a log file when log_to_file is set to true', async () => {
		await loggerService.log('Test message');

		// Assert that the log file was written to
		expect(mockAppendFile).toHaveBeenCalledWith(
			expect.stringContaining('app_'),
			expect.stringContaining('Test message')
		);
	});

	it('should not create a log file when log_to_file is set to false', async () => {
		// Mock ENV.LOG_TO_FILE to be false
		jest.mock('../../../../env', () => ({
			ENV: {
				LOG_TO_FILE: false,
			},
		}));

		// Reset modules to ensure new mocks are used
		jest.resetModules();

		const LoggerServiceModule = await import('../../../services/logger/logger.service');
		const loggerService = new LoggerServiceModule.LoggerService();

		// Wait for the constructor to complete
		await new Promise(process.nextTick);

		await loggerService.log('Test message');

		// Assert that appendFile was not called, indicating no log file was written
		expect(mockAppendFile).not.toHaveBeenCalled();

		// Assert that mkdir was still called to ensure the log directory exists
		expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true });
	});

	it('should handle error gracefully when unable to create log directory', async () => {
		// Mock fs.mkdir to throw an error
		const mockMkdir = jest.fn().mockRejectedValue(new Error('Permission denied'));
		jest.mock('fs/promises', () => ({
			mkdir: mockMkdir,
		}));

		// Mock console.error
		const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

		// Reset modules to ensure new mocks are used
		jest.resetModules();

		const LoggerServiceModule = await import('../../../services/logger/logger.service');
		const loggerService = new LoggerServiceModule.LoggerService();

		// Wait for the constructor to complete
		await new Promise(process.nextTick);

		expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true });
		expect(mockConsoleError).toHaveBeenCalledWith(
			expect.stringContaining('Failed to create log directory')
		);
		expect((loggerService as any).logToFile).toBe(false);

		// Clean up
		mockConsoleError.mockRestore();
	});

	it('should update logger context when setContext is called', () => {
		const loggerService = new LoggerService();
		const newContext = 'TestContext';

		loggerService.setContext(newContext);

		expect(loggerService['context']).toBe(newContext);

		// Create a logger instance
		loggerService['logger'] = new Logger({});

		// Call setContext again
		const anotherContext = 'AnotherContext';
		loggerService.setContext(anotherContext);

		expect(loggerService['context']).toBe(anotherContext);
		expect(loggerService['logger'].settings.name).toBe(anotherContext);
	});

	it('should log messages with correct log level colors in file output', async () => {
		const mockMkdir = jest.fn().mockResolvedValue(undefined);
		const mockAppendFile = jest.fn().mockResolvedValue(undefined);

		jest.mock('fs/promises', () => ({
			mkdir: mockMkdir,
			appendFile: mockAppendFile,
		}));

		// Mock ENV to ensure LOG_TO_FILE is true
		jest.mock('../../../../env', () => ({
			ENV: {
				LOG_TO_FILE: true,
			},
		}));

		// Reset modules to ensure new mocks are used
		jest.resetModules();

		const LoggerServiceModule = await import('../../../services/logger/logger.service');
		const loggerService = new LoggerServiceModule.LoggerService();

		// Wait for the constructor to complete
		await new Promise(process.nextTick);

		// Debug: Check if logToFile is true

		await loggerService.log('Info message');
		await loggerService.error('Error message');
		await loggerService.warn('Warning message');

		// Debug: Log the calls to mockAppendFile

		expect(mockAppendFile).toHaveBeenCalledTimes(3);

		const calls = mockAppendFile.mock.calls;

		expect(calls[0][1]).toMatch(/\x1b\[34m\[INFO\]\x1b\[0m.*Info message/);
		expect(calls[1][1]).toMatch(/\x1b\[31m\[ERROR\]\x1b\[0m.*Error message/);
		expect(calls[2][1]).toMatch(/\x1b\[33m\[WARN\]\x1b\[0m.*Warning message/);
	});

	it('should log messages with correct timestamp format', async () => {
		const mockMkdir = jest.fn().mockResolvedValue(undefined);
		const mockAppendFile = jest.fn().mockResolvedValue(undefined);

		jest.mock('fs/promises', () => ({
			mkdir: mockMkdir,
			appendFile: mockAppendFile,
		}));

		jest.mock('path', () => ({
			join: jest.fn().mockImplementation((...args) => args.join('/')),
		}));

		// Reset modules to ensure new mocks are used
		jest.resetModules();

		const LoggerServiceModule = await import('../../../services/logger/logger.service');
		const loggerService = new LoggerServiceModule.LoggerService();

		// Wait for the constructor to complete
		await new Promise(process.nextTick);

		await loggerService.log('Test message');

		const appendFileCall = mockAppendFile.mock.calls[0];
		const loggedMessage = appendFileCall[1];

		// Regular expression to match the actual timestamp format: MM/DD/YYYY, HH:mm:ss
		const timestampRegex = /\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}/;

		expect(loggedMessage).toMatch(timestampRegex);
	});

	it('should call appropriate logger methods with correct messages', () => {
		const loggerService = new LoggerService();
		const mockLogger = {
			info: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
			silly: jest.fn(),
		};
		(loggerService as any).logger = mockLogger;

		loggerService.log('Info message');
		loggerService.error('Error message');
		loggerService.warn('Warning message');
		loggerService.debug('Debug message');
		loggerService.silly('Silly message');

		expect(mockLogger.info).toHaveBeenCalledWith('Info message');
		expect(mockLogger.error).toHaveBeenCalledWith('Error message');
		expect(mockLogger.warn).toHaveBeenCalledWith('Warning message');
		expect(mockLogger.debug).toHaveBeenCalledWith('Debug message');
		expect(mockLogger.silly).toHaveBeenCalledWith('Silly message');

		// Check if each method was called exactly once
		expect(mockLogger.info).toHaveBeenCalledTimes(1);
		expect(mockLogger.error).toHaveBeenCalledTimes(1);
		expect(mockLogger.warn).toHaveBeenCalledTimes(1);
		expect(mockLogger.debug).toHaveBeenCalledTimes(1);
		expect(mockLogger.silly).toHaveBeenCalledTimes(1);
	});

	it('should handle multiple arguments passed to log methods', async () => {
		const loggerService = new LoggerService();
		const mockLogger = {
			info: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
			silly: jest.fn(),
		};
		(loggerService as any).logger = mockLogger;

		loggerService.log('Info message', { key: 'value' }, 42);
		loggerService.error('Error message', new Error('Test error'), { details: 'More info' });
		loggerService.warn('Warning', 'message', ['array', 'of', 'items']);
		loggerService.debug('Debug', 123, true, null);
		loggerService.silly('Silly', 'log', { nested: { object: true } });

		expect(mockLogger.info).toHaveBeenCalledWith('Info message', { key: 'value' }, 42);
		expect(mockLogger.error).toHaveBeenCalledWith('Error message', expect.any(Error), {
			details: 'More info',
		});
		expect(mockLogger.warn).toHaveBeenCalledWith('Warning', 'message', ['array', 'of', 'items']);
		expect(mockLogger.debug).toHaveBeenCalledWith('Debug', 123, true, null);
		expect(mockLogger.silly).toHaveBeenCalledWith('Silly', 'log', { nested: { object: true } });
	});

	it('should create a new logger instance when getLogger is called for the first time', () => {
		const loggerService = new LoggerService();

		// Initially, the logger should be null
		expect((loggerService as any).logger).toBeNull();

		// Call getLogger method
		const logger = (loggerService as any).getLogger();

		// Now, the logger should be an instance of Logger
		expect(logger).toBeInstanceOf(Logger);

		// The logger instance should be stored in the service
		expect((loggerService as any).logger).toBe(logger);

		// Calling getLogger again should return the same instance
		const secondLogger = (loggerService as any).getLogger();
		expect(secondLogger).toBe(logger);
	});

	it('should reuse existing logger instance on subsequent getLogger calls', () => {
		const loggerService = new LoggerService();
		const logger1 = (loggerService as any).getLogger();
		const logger2 = (loggerService as any).getLogger();

		expect(logger1).toBe(logger2);
	});
});
