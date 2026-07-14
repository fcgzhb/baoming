import { request } from './request';
import type { PageResult } from '@baoming/shared';
import { OrderStatus, OrderStatusLabel, RefundStatus } from '@baoming/shared';

export interface AdminOrder {
  id: string;
  orderNo: string;
  projectId: string;
  projectTitle: string | null;
  userId: string;
  participantName: string | null;
  participantPhone: string | null;
  participantIdCard: string | null;
  amount: string;
  status: OrderStatus;
  refundStatus: RefundStatus | null;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export interface AdminOrderListQuery {
  page?: number;
  size?: number;
  projectId?: string;
  status?: OrderStatus;
  orderNo?: string;
  phone?: string;
  name?: string;
}

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  [RefundStatus.PENDING]: '待退款',
  [RefundStatus.PROCESSING]: '退款中',
  [RefundStatus.SUCCESS]: '已退款',
  [RefundStatus.FAILED]: '退款失败',
};

export { OrderStatusLabel };

export const listOrders = (params: AdminOrderListQuery) =>
  request.get<unknown, PageResult<AdminOrder>>('/orders', { params });

export const getOrder = (id: string) => request.get<unknown, AdminOrder>(`/orders/${id}`);

export const refundOrder = (id: string) =>
  request.post<unknown, { id: string; status: string; refundStatus: string }>(`/orders/${id}/refund`);
