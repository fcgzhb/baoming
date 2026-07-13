import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ErrorCode } from '@baoming/shared';

/** Wraps successful handler return values in the `{ code, msg, data }` envelope. */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, { code: number; msg: string; data: T | null }> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>) {
    return next.handle().pipe(
      map((data) => ({
        code: ErrorCode.OK,
        msg: 'success',
        data: data ?? null,
      })),
    );
  }
}
