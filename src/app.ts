import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { AppError } from '#error/app.error.ts';
import { BadRequestError } from '#error/bad-request.error.ts';
import { asyncLocalStorage, logger } from '#logger';

const errorManager = (err: Error, c: Context) => {
  const requestId = asyncLocalStorage.getStore()?.requestId;

  logger.error({
    message: 'Request failed',
    error: err,
    data: { requestId },
  });

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

export const app = new OpenAPIHono({
  // Runs only when @hono/zod-openapi fails request validation (body, params, query).
  // Thrown errors are caught by app.onError(errorManager) below.
  defaultHook: (result, c) => {
    if (!result.success) {
      throw new BadRequestError({
        message: 'Validation failed',
        error: result.error,
        context: { path: c.req.path },
      });
    }
  },
});

app.use(async (c, next) => {
  const startTime = performance.now();
  const requestId = randomUUID();

  await asyncLocalStorage.run(
    {
      startTime,
      requestId,
      path: c.req.path,
      method: c.req.method,
    },
    async () => {
      await next();
      const duration = performance.now() - startTime;
      c.header('X-Request-Id', requestId);
      c.header('X-Response-Time', `${duration.toFixed(2)}ms`);

      logger.info({
        message: 'Request completed',
        data: {
          status: c.res.status,
          duration: `${duration.toFixed(2)}ms`,
          slow: duration > 3_000,
        },
      });
    },
  );
});

app.onError(errorManager);

app.doc31('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Hono App API',
    version: '1.0.0',
  },
});

export default app;
