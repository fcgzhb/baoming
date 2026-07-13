# Admin API（后台管理端）

Base: `/api/admin` · 认证：`Authorization: Bearer <admin-jwt>`（除登录外）

## 认证

### POST /api/admin/auth/login
- req: `{ "username": "admin", "password": "******" }`
- resp `data`: `{ "token": "<jwt>", "admin": { id, username, displayName } }`
- 行为：bcrypt 校验 → 签发 admin JWT（role=admin）。

### GET /api/admin/auth/me
- resp `data`: `{ id, username, displayName, status }`

## 游学项目

### GET /api/admin/projects?status=&q=&page=1&size=10
- resp `data.list[]`: `{ id, title, coverImageUrl, price, totalQuota, registeredCount, status, enrollDeadline, departureDate, createdAt }`

### GET /api/admin/projects/:id
含富文本与行程完整字段。

### POST /api/admin/projects
- req:
  ```json
  {
    "title": "2026 北京科技夏令营",
    "coverImageUrl": "https://...",
    "description": "<富文本>",
    "itinerary": "<行程>",
    "departureDate": "2026-08-01",
    "returnDate": "2026-08-07",
    "price": "3999.00",
    "totalQuota": 30,
    "enrollDeadline": "2026-07-25T23:59:59+08:00",
    "status": "draft"
  }
  ```
- resp `data`: `{ id, ... }` · 行为：`created_by_admin_id` 取当前管理员；`registered_count=0`。

### PUT /api/admin/projects/:id
全量/部分更新（除 `registered_count` 由系统维护，禁止前端改）。

### POST /api/admin/projects/:id/publish
上架：`status → published`。仅 `draft`/`offline` 可上架。

### POST /api/admin/projects/:id/offline
下架：`status → offline`。已产生的订单不受影响（spec 边界场景）。

### DELETE /api/admin/projects/:id
软删除（写 `deleted_at`）。建议仅允许 `draft` 或无订单时删除。

## 报名订单

### GET /api/admin/orders?projectId=&status=&phone=&name=&orderNo=&page=1&size=20
- resp `data.list[]`: `{ id, orderNo, projectId, projectTitle, userId, participantName, participantPhone, participantIdCard, amount, status, refundStatus, paidAt, refundedAt, createdAt }`

### GET /api/admin/orders/:id
订单 + 参团人完整详情 + 用户基本信息。

### POST /api/admin/orders/:id/refund
发起**全额**在线退款（v1）。
- req: `{ "reason": "用户申请" }`（可选）
- resp `data`: `{ id, status: "refunded" | refundStatus: "processing" }`
- 行为：
  1. 校验订单为 `confirmed`（已报名）。
  2. 调微信 V3 退款接口，金额=订单 `amount`（转分）。
  3. 接口成功/处理中 → 置 `refund_status`，等待 `refund-notify`。
  4. 退款回调成功 → 订单 `refunded` + `registered_count - 1`（幂等）。
  5. 写 `audit_logs`（action=`order.refund`，amount=退款额）。

## 用户

### GET /api/admin/users?q=&page=1&size=20
- resp `data.list[]`: `{ id, nickname, avatarUrl, phone, createdAt, orderCount }`
  - `orderCount` 由聚合得出。

### GET /api/admin/users/:id
用户基本信息 + 订单简要列表。

## 权限与审计
- 所有后台写操作（项目发布/下架/删除、退款）写 `audit_logs`（FR-108）。
- 单一管理员角色（v1，spec 假设）；后续多角色时加角色守卫。
