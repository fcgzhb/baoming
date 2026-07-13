import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@baoming/shared';

/**
 * Business error carrying the API envelope's `code`. The global exception filter
 * renders it as `{ code, msg, data: null }` with a matching HTTP status.
 */
export class BusinessError extends HttpException {
  constructor(
    public readonly bizCode: number,
    message: string,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code: bizCode, msg: message, data: null }, httpStatus);
  }

  static conflict(message: string) {
    return new BusinessError(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT);
  }
  static unauthorized(message = '未登录或登录已过期') {
    return new BusinessError(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
  }
  static forbidden(message = '无权限') {
    return new BusinessError(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }
  static notFound(message = '资源不存在') {
    return new BusinessError(ErrorCode.CONFLICT, message, HttpStatus.NOT_FOUND);
  }
}
