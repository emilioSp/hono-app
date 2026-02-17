import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId?: string;
  startTime?: number;
  path?: string;
  method?: string;
  [key: string]: unknown;
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

  const logCache = new Set();

  const log = JSON.stringify(logObject, (_, value) => {
    if (typeof value === 'object' && value !== null) {
      if (logCache.has(value)) {
        return;
      }
      logCache.add(value);
    }
    return value;
  });

  logCache.clear();

  return log;
};

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

const getConfiguredLogLevel = (): LogLevel => {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  if (
    level === 'debug' ||
    level === 'info' ||
    level === 'warn' ||
    level === 'error'
  ) {
    return level;
  }
  return 'warn'; // Default: only warn and error
};

const shouldLog = (level: LogLevel): boolean => {
  const configuredLevel = getConfiguredLogLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configuredLevel];
};

export const logger = {
  debug: ({
    message,
    data,
  }: {
    message: string;
    data?: Record<string, unknown>;
  }) => {
    if (shouldLog('debug')) {
      console.debug(formatLog('debug', { message, data }));
    }
  },

  info: ({
    message,
    data,
  }: {
    message: string;
    data?: Record<string, unknown>;
  }) => {
    if (shouldLog('info')) {
      console.info(formatLog('info', { message, data }));
    }
  },

  warn: ({
    message,
    data,
  }: {
    message: string;
    data?: Record<string, unknown>;
  }) => {
    console.warn(formatLog('warn', { message, data }));
  },

  error: ({
    message,
    error,
    data,
  }: {
    message: string;
    error?: Error;
    data?: Record<string, unknown>;
  }) => {
    console.error(formatLog('error', { message, error, data }));
  },
};
