import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

export type AppErrorType = {
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
};

export class AppError extends Error {
  public code = 'APP_ERROR';
  public status: ContentfulStatusCode = 500;
  public readonly context?: Record<string, unknown>;
  public readonly details?: Array<{ field: string; message: string }>;

  constructor({ message, error, context }: AppErrorType) {
    super(message);
    this.context = context;
    if (error instanceof ZodError) {
      this.details = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
    }
  }
}
