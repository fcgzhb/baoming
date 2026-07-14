import { request } from './request';
import type { PageResult } from '@baoming/shared';

export interface AdminUser {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
  orderCount: number;
}

export interface AdminUserListQuery {
  page?: number;
  size?: number;
  q?: string;
}

export const listUsers = (params: AdminUserListQuery) =>
  request.get<unknown, PageResult<AdminUser>>('/users', { params });

export const getUser = (id: string) => request.get<unknown, AdminUser & { orders: unknown[] }>(`/users/${id}`);
