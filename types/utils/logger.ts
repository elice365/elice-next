// Utils Logger Type Definitions

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = 'AUTH' | 'API' | 'DB' | 'EMAIL' | 'PERFORMANCE' | 'GENERAL';

export interface LogEntry {
  level: LogLevel;
  context: LogContext;
  message: string;
  data?: any;
  timestamp: Date;
  stack?: string;
}