import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorBody } from '@projectflow/shared';

/**
 * Normalises every thrown error into the `ApiErrorBody` shape so clients can
 * rely on a single error contract. Unexpected errors are logged server-side and
 * reported to the client as a generic 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(toErrorBody(exception));
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unhandled exception',
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    } satisfies ApiErrorBody);
  }
}

function toErrorBody(exception: HttpException): ApiErrorBody {
  const status = exception.getStatus();
  const payload = exception.getResponse();

  if (typeof payload === 'string') {
    return { statusCode: status, message: payload, error: exception.name };
  }

  const record = payload as Record<string, unknown>;
  const rawMessage = record.message;

  return {
    statusCode: status,
    message: Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : exception.message,
    error: typeof record.error === 'string' ? record.error : exception.name,
  };
}
