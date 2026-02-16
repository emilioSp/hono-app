import { performance } from 'node:perf_hooks';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { requestId } from 'hono/request-id';
import { AppError } from '#error/app.error.ts';
import { asyncLocalStorage, logger } from '#logger';

const errorManager = (err: Error, c: Context) => {
  const requestId = asyncLocalStorage.getStore()?.requestId;
  logger.error('Request failed', err, { requestId });

  if (err instanceof AppError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          requestId,
        },
      },
      err.status,
    );
  }

  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId,
      },
    },
    500,
  );
};

export const app = new Hono();

app.use(requestId());

app.use(async (c, next) => {
  const startTime = performance.now();

  await asyncLocalStorage.run(
    {
      requestId: c.var.requestId,
      startTime,
      path: c.req.path,
      method: c.req.method,
    },
    async () => {
      c.header('X-Request-Id', c.var.requestId);

      await next();
      const duration = performance.now() - startTime;
      c.header('X-Response-Time', `${duration.toFixed(2)}ms`);

      logger.info('Request completed', {
        status: c.res.status,
        duration: `${duration.toFixed(2)}ms`,
      });
    },
  );
});

app.onError(errorManager);

export default app;
