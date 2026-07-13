export type JwtRole = 'user' | 'admin';

export interface JwtPayload {
  sub: string; // user.id or admin.id
  role: JwtRole;
}

export interface RequestUser {
  id: string;
  role: JwtRole;
}
