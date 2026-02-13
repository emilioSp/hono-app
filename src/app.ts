import { performance } from 'node:perf_hooks';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { AppError } from '#error/app.error.ts';

const errorManager = (err: Error, c: Context) => {
  console.error(err);

  if (err instanceof AppError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
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
      },
    },
    500,
  );
};

export const app = new Hono();

app.use(async (c, next) => {
  const startTime = performance.now();
  await next();
  const now = performance.now();
  c.header('X-Response-Time', `${(now - startTime).toFixed(2)}ms`);
});

app.onError(errorManager);

export default app;
