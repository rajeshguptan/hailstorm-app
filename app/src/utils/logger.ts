import log from 'electron-log/renderer';

// Get log level from window.LOG_LEVEL (set by main process via IPC)
// electron-log handles the file/console logging in main process
// In renderer, this sends logs to main process via IPC

export const logger = {
  error: (...args: any[]) => log.error('[ERROR]', ...args),
  warn: (...args: any[]) => log.warn('[WARN]', ...args),
  info: (...args: any[]) => log.info('[INFO]', ...args),
  verbose: (...args: any[]) => log.verbose('[VERBOSE]', ...args),
  debug: (...args: any[]) => log.debug('[DEBUG]', ...args),
  silly: (...args: any[]) => log.silly('[SILLY]', ...args)
};

export const logLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'] as const;
export type LogLevel = typeof logLevels[number];