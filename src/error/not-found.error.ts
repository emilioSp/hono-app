import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { AppError, type AppErrorType } from './app.error.ts';

export class NotFoundError extends AppError {
  public readonly code = 'NOT_FOUND';
  public readonly status: ContentfulStatusCode = 404;

  constructor({ message, error, context }: AppErrorType) {
    super({ message, error, context });
  }
}
