import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import { BusinessError } from '../errors/business-error';

/** Authorizes based on @Roles(...) metadata; expects JwtAuthGuard to have set req.user. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user?: { role: Role } }>();
    if (!user || !required.includes(user.role)) {
      throw BusinessError.forbidden('无权限访问');
    }
    return true;
  }
}
