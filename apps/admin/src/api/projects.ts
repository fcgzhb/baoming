import { request } from './request';
import type { PageResult } from '@baoming/shared';
import { ProjectStatus } from '@baoming/shared';

export interface Project {
  id: string;
  title: string;
  coverImageUrl?: string | null;
  description?: string | null;
  itinerary?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  price: string;
  totalQuota: number;
  registeredCount: number;
  enrollDeadline?: string | null;
  status: ProjectStatus;
  createdAt: string;
}

export interface ProjectListQuery {
  page?: number;
  size?: number;
  status?: ProjectStatus;
  q?: string;
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  [ProjectStatus.DRAFT]: '草稿',
  [ProjectStatus.PUBLISHED]: '已上架',
  [ProjectStatus.OFFLINE]: '已下架',
};

export const STATUS_TAG_TYPE: Record<ProjectStatus, '' | 'success' | 'info' | 'warning'> = {
  [ProjectStatus.DRAFT]: 'info',
  [ProjectStatus.PUBLISHED]: 'success',
  [ProjectStatus.OFFLINE]: 'warning',
};

export const listProjects = (params: ProjectListQuery) =>
  request.get<unknown, PageResult<Project>>('/projects', { params });

export const getProject = (id: string) => request.get<unknown, Project>(`/projects/${id}`);

export interface ProjectInput {
  title: string;
  coverImageUrl?: string;
  price: number;
  totalQuota: number;
  departureDate?: string;
  returnDate?: string;
  enrollDeadline?: string;
  description?: string;
  itinerary?: string;
}

export const createProject = (data: ProjectInput) =>
  request.post<unknown, Project>('/projects', data);

export const updateProject = (id: string, data: Partial<ProjectInput>) =>
  request.put<unknown, Project>(`/projects/${id}`, data);

export const publishProject = (id: string) =>
  request.post<unknown, Project>(`/projects/${id}/publish`);

export const offlineProject = (id: string) =>
  request.post<unknown, Project>(`/projects/${id}/offline`);

export const deleteProject = (id: string) =>
  request.delete<unknown, { id: string }>(`/projects/${id}`);
