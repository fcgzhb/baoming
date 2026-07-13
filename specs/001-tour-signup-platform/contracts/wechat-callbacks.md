# WeChat Callbacks（微信支付/退款异步回调）

Base: `/api/wechat` · **公网 HTTPS 可达** · 不走 JWT，依赖**微信平台公钥/证书验签**

> 使用微信支付 V3 API：回调报文为 AES-256-GCM 加密的 `resource`，须以 APIv3 密钥解密并验签。建议用 `wechatpay-node-v3` SDK 完成验签+解密。

## POST /api/wechat/pay/notify
微信支付成功通知。

- 报文（V3 结构，节选）：
  ```json
  {
    "id": "evt-...",
    "event_type": "TRANSACTION.SUCCESS",
    "resource": {
      "algorithm": "AEAD_AES_256_GCM",
      "ciphertext": "...",
      "nonce": "...",
      "associated_data": "transaction"
    }
  }
  ```
- 解密后 `data`（节选）：`{ out_trade_no, transaction_id, trade_state, amount:{ total } }`
  - `out_trade_no` = 我方 `orders.order_no`
  - `amount.total` 单位为**分**
- 处理步骤：
  1. **验签 + 解密**（SDK）。
  2. 按 `out_trade_no` 查订单；**幂等**：若已 `confirmed` 直接返回成功响应。
  3. 校验 `amount.total` == 订单 `amount` 转分值（金额不符 → 告警、不确认、不退款，人工介入）。
  4. **原子扣减名额**：
     ```sql
     UPDATE projects SET registered_count = registered_count + 1
     WHERE id = :projectId AND registered_count < total_quota;
     ```
     - 受影响行 = 1 → 订单 `pending → confirmed`，写 `paid_at`、`transaction_id`。
     - 受影响行 = 0 → 名额已被抢完 → 订单 `pending → cancelled`，立即发起全额退款，记录原因 `oversold`。
  5. 写 `audit_logs`（action=`order.pay_confirmed` / `order.oversold_refund`）。
- 成功响应（必须，否则微信会重试）：
  ```json
  { "code": "SUCCESS", "message": "OK" }
  ```
  处理失败返回非 SUCCESS，触发微信重试（仍依赖幂等保护）。

## POST /api/wechat/refund/notify
微信退款结果通知。

- `event_type`: `REFUND.SUCCESS` / `REFUND.ABNORMAL` / `REFUND.CLOSED`
- 解密后 `data`（节选）：`{ out_trade_no, out_refund_no, refund_id, refund_status, amount:{ refund } }`
- 处理步骤：
  1. 验签 + 解密。
  2. 按 `out_trade_no` 查订单；**幂等**：已 `refunded` 直接返回 SUCCESS。
  3. `REFUND.SUCCESS` → 订单 `confirmed → refunded`，写 `refunded_at`、`refund_transaction_id`、`refund_amount`；
     释放名额：`UPDATE projects SET registered_count = registered_count - 1 WHERE id = :projectId AND registered_count > 0;`
     （幂等：先判订单状态再扣，避免重复释放。）
  4. `REFUND.ABNORMAL`/异常 → 订单 `refund_status` 置失败/异常，等待人工处理或重试。
  5. 写 `audit_logs`（action=`order.refund_confirmed`，amount=退款额）。
- 成功响应：`{ "code": "SUCCESS", "message": "OK" }`

## 掉单兜底（FR-013）
- 提供「查单」能力（定时任务或后台按钮）：对超时仍 `pending` 的订单调 V3 查询接口，按微信实际状态：
  - 已支付 → 走 `pay/notify` 同逻辑补单。
  - 已关闭/未支付 → 订单 `pending → cancelled`。
- 幂等保证：补单与回调可并存，状态迁移以当前状态为前提（仅 `pending` 可转 `confirmed`）。

## 重试与安全
- 微信对未收到 SUCCESS 的通知会按退避策略重试多次，**所有处理必须幂等**。
- 回调必须验签，禁止信任未验签报文。
- 回调与退款发起方（管理员）可能并发，状态迁移用乐观条件（`WHERE status='confirmed'`）。
