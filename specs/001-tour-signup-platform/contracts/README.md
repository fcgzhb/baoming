# API Contracts

**Feature**: 旅游游学项目报名小程序平台 · **Backend**: NestJS · **Date**: 2026-07-13

本目录定义后端对外的三类接口契约，前端（uni-app 小程序、Vue3 后台）与微信平台均据此对接。实现须保持与本文档一致；变更须经契约更新。

- [mini-program.md](./mini-program.md) — 小程序端（用户）REST API
- [admin.md](./admin.md) — 后台管理端 REST API
- [wechat-callbacks.md](./wechat-callbacks.md) — 微信支付/退款异步回调

## 通用约定

- **Base URL**：`/api`
  - 小程序：`/api/mp/*`
  - 后台：`/api/admin/*`
  - 微信回调：`/api/wechat/*`（公网 HTTPS 可达，验签后处理）
- **认证**：除登录与微信回调外，请求头携带 `Authorization: Bearer <jwt>`
  - 小程序用户 JWT：claim `{ sub: userId, role: "user" }`
  - 管理员 JWT：claim `{ sub: adminId, role: "admin" }`
- **统一响应信封**（与既有项目风格一致）：
  ```json
  { "code": 0, "msg": "success", "data": { } }
  ```
  - `code = 0` 表示成功；非 0 表示业务错误，`msg` 为用户可读信息，`data` 可为 `null`。
  - 分页响应 `data`：`{ list: [...], total: N, page: n, size: s }`
- **金额**：`DECIMAL(10,2)` 字符串/数字（元，如 `"1999.00"`）；与微信交互时后端转换为分。
- **时间**：ISO-8601 字符串（如 `2026-07-13T10:00:00.000Z`）。
- **错误码**（建议前缀）：
  - `4001` 未登录 / token 失效
  - `4003` 无权限
  - `4090` 业务冲突（如名额已满、重复报名、订单状态非法）
  - `4220` 参数校验失败
  - `5000` 服务端错误
- **幂等**：支付/退款回调以 `transaction_id` + 订单状态做幂等（见 wechat-callbacks.md）。
- **安全**：所有写接口服务端再校验身份与资源归属；不信任前端传入的 `userId`/`amount`/`status`。
