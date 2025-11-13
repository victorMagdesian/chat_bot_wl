import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Extract error details
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message,
      error: typeof message === 'object' ? (message as any).error : undefined,
    };

    // Log error with context
    const logContext = {
      statusCode: status,
      path: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      user: (request as any).user?.id,
      tenant: (request as any).tenant?.id,
    };

    // Log authentication failures with IP address
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.warn(
        `Authentication/Authorization failure: ${errorResponse.message}`,
        {
          ...logContext,
          ip: request.ip,
          headers: request.headers,
        },
      );
    } else if (status >= 500) {
      // Log server errors
      this.logger.error(
        `Server error: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        exception instanceof Error ? exception.stack : '',
        logContext,
      );

      // Send to Sentry for critical errors
      Sentry.captureException(exception, {
        contexts: {
          request: {
            url: request.url,
            method: request.method,
            headers: request.headers,
            query: request.query,
            body: request.body,
          },
          user: (request as any).user
            ? {
                id: (request as any).user.id,
                email: (request as any).user.email,
              }
            : undefined,
          tenant: (request as any).tenant
            ? {
                id: (request as any).tenant.id,
                domain: (request as any).tenant.domain,
              }
            : undefined,
        },
        tags: {
          statusCode: status.toString(),
          path: request.url,
          method: request.method,
        },
        level: 'error',
      });
    } else {
      // Log client errors
      this.logger.warn(
        `Client error: ${errorResponse.message}`,
        logContext,
      );
    }

    // Send sanitized error response to client
    response.status(status).json({
      statusCode: errorResponse.statusCode,
      timestamp: errorResponse.timestamp,
      path: errorResponse.path,
      message: errorResponse.message,
      error: errorResponse.error,
    });
  }
}
