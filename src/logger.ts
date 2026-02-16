import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId: string;
  startTime: number;
  path?: string;
  method?: string;
};

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogPayload = {
  message: string;
  data?: Record<string, unknown>;
  error?: Error;
};

const formatLog = (level: LogLevel, payload: LogPayload): string => {
  const context = asyncLocalStorage.getStore();
  const timestamp = new Date().toISOString();

  const logObject: Record<string, unknown> = {
    timestamp,
    level,
    requestId: context?.requestId ?? 'no-request-context',
    message: payload.message,
  };

  if (context?.path) {
    logObject.path = context.path;
  }

  if (context?.method) {
    logObject.method = context.method;
  }

  if (payload.data) {
    logObject.data = payload.data;
  }

  if (payload.error) {
    logObject.error = {
      name: payload.error.name,
      message: payload.error.message,
      stack: payload.error.stack,
    };
  }

  return JSON.stringify(logObject);
};

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => {
    console.debug(formatLog('debug', { message, data }));
  },

  info: (message: string, data?: Record<string, unknown>) => {
    console.info(formatLog('info', { message, data }));
  },

  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(formatLog('warn', { message, data }));
  },

  error: (message: string, error?: Error, data?: Record<string, unknown>) => {
    console.error(formatLog('error', { message, error, data }));
  },
};
