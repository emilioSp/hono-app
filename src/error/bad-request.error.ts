import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { AppError, type AppErrorType } from './app.error.ts';

export class BadRequestError extends AppError {
  public readonly code = 'BAD_REQUEST';
  public readonly status: ContentfulStatusCode = 400;

  constructor({ message, error, context }: AppErrorType) {
    super({ message, error, context });
  }
}
