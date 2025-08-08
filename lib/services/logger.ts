/**
 * Structured logging service with environment-based controls
 * Replaces console.log statements with proper logging levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
}

class Logger {
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    return true; // Log everything in development
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const logMessage = entry.context 
      ? `[${entry.context}] ${entry.message}`
      : entry.message;

    switch (entry.level) {
      case 'debug':
        console.debug(logMessage, entry.data || '');
        break;
      case 'info':
        console.info(logMessage, entry.data || '');
        break;
      case 'warn':
        console.warn(logMessage, entry.data || '');
        break;
      case 'error':
        console.error(logMessage, entry.data || '');
        break;
    }
  }

  debug(message: string, context?: string, data?: any): void {
    const entry = this.formatMessage('debug', message, context, data);
    this.writeLog(entry);
  }

  info(message: string, context?: string, data?: any): void {
    const entry = this.formatMessage('info', message, context, data);
    this.writeLog(entry);
  }

  warn(message: string, context?: string, data?: any): void {
    const entry = this.formatMessage('warn', message, context, data);
    this.writeLog(entry);
  }

  error(message: string, context?: string, data?: any): void {
    const entry = this.formatMessage('error', message, context, data);
    this.writeLog(entry);
  }

  // Specialized methods for common use cases
  auth(message: string, data?: any): void {
    this.info(message, 'AUTH', data);
  }

  cleanup(message: string, data?: any): void {
    this.info(message, 'CLEANUP', data);
  }

  social(provider: string, message: string, data?: any): void {
    this.info(message, `SOCIAL:${provider.toUpperCase()}`, data);
  }

  api(message: string, data?: any): void {
    this.info(message, 'API', data);
  }

  database(message: string, data?: any): void {
    this.info(message, 'DB', data);
  }
}

// Export singleton instance
export const logger = new Logger();

// For compatibility, export individual methods
export const { debug, info, warn, error, auth, cleanup, social, api, database } = logger;