// @baoming/shared — cross-app types, enums, constants.
// Consumed by server (NestJS), admin (Vue3), and mp (uni-app).

// ---------- Order ----------
export enum OrderStatus {
  PENDING = 'pending', // 待支付
  CONFIRMED = 'confirmed', // 已报名
  REFUNDED = 'refunded', // 已退款
  CANCELLED = 'cancelled', // 已取消
}

export const OrderStatusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '待支付',
  [OrderStatus.CONFIRMED]: '已报名',
  [OrderStatus.REFUNDED]: '已退款',
  [OrderStatus.CANCELLED]: '已取消',
};

/** Active statuses — used for the per-(project,idCard) uniqueness rule (FR-015). */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];

// ---------- Project ----------
export enum ProjectStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  OFFLINE = 'offline',
}

// ---------- Participant ----------
export enum IdCardType {
  ID_CARD = '身份证',
  PASSPORT = '护照',
  HUKOU = '户口本',
  OTHER = '其他',
}

// ---------- Refund ----------
export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

// ---------- API response envelope ----------
export interface ApiResponse<T = unknown> {
  code: number; // 0 = success
  msg: string;
  data: T | null;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

// ---------- Error codes ----------
export const ErrorCode = {
  OK: 0,
  UNAUTHORIZED: 4001,
  FORBIDDEN: 4003,
  CONFLICT: 4090, // 名额满 / 重复报名 / 状态非法
  VALIDATION: 4220,
  INTERNAL: 5000,
} as const;
