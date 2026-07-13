import { request } from './request';

export interface AdminInfo {
  id: string;
  username: string;
  displayName: string;
}

export interface LoginResult {
  token: string;
  admin: AdminInfo;
}

// NOTE: endpoint implemented in Phase 4 (US5 admin auth). Returns 404 until then.
export const login = (username: string, password: string) =>
  request.post<unknown, LoginResult>('/auth/login', { username, password });

export const getMe = () => request.get<unknown, AdminInfo>('/auth/me');
