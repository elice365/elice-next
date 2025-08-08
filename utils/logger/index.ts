/**
 * Centralized logging system
 * Replaces scattered console.log statements with structured logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = 'AUTH' | 'API' | 'DB' | 'EMAIL' | 'PERFORMANCE' | 'GENERAL';

interface LogEntry {
  level: LogLevel;
  context: LogContext;
  message: string;
  data?: any;
  timestamp: Date;
  stack?: string;
}

class Logger {
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = `[${entry.context}]`;
    const level = `[${entry.level.toUpperCase()}]`;
    
    return `${timestamp} ${level} ${context} ${entry.message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (this.isProduction) {
      return ['warn', 'error'].includes(level);
    }
    
    // In development, log everything
    return this.isDevelopment;
  }

  private createLogEntry(
    level: LogLevel,
    context: LogContext,
    message: string,
    data?: any
  ): LogEntry {
    return {
      level,
      context,
      message,
      data,
      timestamp: new Date(),
      stack: level === 'error' ? new Error().stack : undefined,
    };
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedMessage = this.formatMessage(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(formattedMessage, entry.data);
        break;
      case 'info':
        console.info(formattedMessage, entry.data);
        break;
      case 'warn':
        console.warn(formattedMessage, entry.data);
        break;
      case 'error':
        console.error(formattedMessage, entry.data);
        if (entry.stack) console.error(entry.stack);
        break;
    }
  }

  debug(message: string, context: LogContext = 'GENERAL', data?: any): void {
    this.writeLog(this.createLogEntry('debug', context, message, data));
  }

  info(message: string, context: LogContext = 'GENERAL', data?: any): void {
    this.writeLog(this.createLogEntry('info', context, message, data));
  }

  warn(message: string, context: LogContext = 'GENERAL', data?: any): void {
    this.writeLog(this.createLogEntry('warn', context, message, data));
  }

  error(message: string, context: LogContext = 'GENERAL', data?: any): void {
    this.writeLog(this.createLogEntry('error', context, message, data));
  }

  // Specialized logging methods
  auth = {
    info: (message: string, data?: any) => this.info(message, 'AUTH', data),
    warn: (message: string, data?: any) => this.warn(message, 'AUTH', data),
    error: (message: string, data?: any) => this.error(message, 'AUTH', data),
  };

  api = {
    info: (message: string, data?: any) => this.info(message, 'API', data),
    warn: (message: string, data?: any) => this.warn(message, 'API', data),
    error: (message: string, data?: any) => this.error(message, 'API', data),
  };

  db = {
    info: (message: string, data?: any) => this.info(message, 'DB', data),
    warn: (message: string, data?: any) => this.warn(message, 'DB', data),
    error: (message: string, data?: any) => this.error(message, 'DB', data),
  };

  email = {
    info: (message: string, data?: any) => this.info(message, 'EMAIL', data),
    warn: (message: string, data?: any) => this.warn(message, 'EMAIL', data),
    error: (message: string, data?: any) => this.error(message, 'EMAIL', data),
  };

  performance = {
    info: (message: string, data?: any) => this.info(message, 'PERFORMANCE', data),
    warn: (message: string, data?: any) => this.warn(message, 'PERFORMANCE', data),
  };
}

// Export singleton instance
export const logger = new Logger();

// Legacy console.log replacement
export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Structured error logging
export const logError = (
  message: string,
  error: unknown,
  context: LogContext = 'GENERAL'
) => {
  logger.error(message, context, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
};