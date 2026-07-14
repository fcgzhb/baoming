import { SetMetadata } from '@nestjs/common';
import { JwtRole } from '../interfaces/jwt-payload';

export const ROLES_KEY = 'roles';
export type Role = JwtRole;

/** Restricts a route to the given roles (used with RolesGuard after JwtAuthGuard). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
