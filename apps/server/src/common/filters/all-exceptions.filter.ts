import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ErrorCode } from '@baoming/shared';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const r = exception.getResponse();
      const payload = typeof r === 'string' ? { msg: r } : (r as Record<string, unknown>);

      const code = (payload.code as number) ?? this.mapStatusToBizCode(status);
      let msg: string;
      if (payload.msg) {
        msg = String(payload.msg);
      } else if (Array.isArray(payload.message)) {
        msg = (payload.message as string[]).join('; ');
      } else if (payload.message) {
        msg = String(payload.message);
      } else {
        msg = exception.message;
      }

      res.status(status).json({ code, msg, data: null });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: ErrorCode.INTERNAL,
      msg: '服务器内部错误',
      data: null,
    });
  }

  private mapStatusToBizCode(status: number): number {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.VALIDATION;
      default:
        return ErrorCode.INTERNAL;
    }
  }
}
