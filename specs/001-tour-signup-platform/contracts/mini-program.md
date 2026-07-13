# Mini Program API（小程序端 / 用户）

Base: `/api/mp` · 认证：`Authorization: Bearer <user-jwt>`（除登录外）

## 认证

### POST /api/mp/auth/login
微信授权登录。小程序 `uni.login({provider:'weixin'})` 取 `code` 上报。
- req: `{ "code": "<wx.login code>" }`
- resp `data`: `{ "token": "<jwt>", "user": { id, openid, nickname, avatarUrl, phone } }`
- 行为：后端 `code2session` 换 openid → upsert `users` → 签发 JWT（role=user）。

### POST /api/mp/auth/phone
获取微信授权手机号。小程序 `<button open-type="getPhoneNumber">` 回调 `code` 上报。
- req: `{ "code": "<getPhoneNumber code>" }`
- resp `data`: `{ "phone": "13800000000" }`
- 行为：后端调 `phonenumber/getPhoneNumber` 换号 → 写 `users.phone`。

### POST /api/mp/consent
记录敏感信息授权同意（FR-014）。报名前如未记录需先调用。
- req: `{ "consentType": "sensitive_info_collection", "policyVersion": "1.0" }`
- resp `data`: `{ "id": 1, "consentedAt": "..." }`

## 用户

### GET /api/mp/user/profile
- resp `data`: `{ id, nickname, avatarUrl, phone, hasConsent: bool }`

## 游学项目

### GET /api/mp/projects?page=1&size=10
小程序首页列表（仅 `published` 且未到截止时间，按创建倒序）。
- resp `data.list[]`: `{ id, title, coverImageUrl, price, departureDate, enrollDeadline, remainingQuota, statusLabel }`
  - `remainingQuota = total_quota - registered_count`

### GET /api/mp/projects/:id
详情。
- resp `data`: `{ id, title, coverImageUrl, description, itinerary, departureDate, returnDate, price, totalQuota, registeredCount, remainingQuota, enrollDeadline, enrollable: bool }`
  - `enrollable = published && now<=enrollDeadline && remainingQuota>0`

## 报名订单

### POST /api/mp/orders
创建报名订单（待支付，**不扣名额**）。
- req:
  ```json
  {
    "projectId": 1,
    "participant": {
      "name": "张三", "idCardType": "身份证", "idCard": "110...",
      "phone": "138...", "relation": "本人",
      "emergencyName": "李四", "emergencyPhone": "139...",
      "schoolGrade": "XX学校X年级", "remark": ""
    }
  }
  ```
- resp `data`: `{ "orderId": 1, "orderNo": "BM20260713...", "amount": "1999.00" }`
- 行为：
  1. 服务端校验 `enrollable`（满/截止 → `4090`）。
  2. 应用层校验同项目同证件号无有效订单（FR-015，重复 → `4090` "该参团人已报名"）。
  3. 校验证件号格式；写入 `participants` + `orders(status=pending)`，`amount=project.price`（下单锁定），冗余 `participant_id_card`。
  4. 生成列 `active_key` 作为唯一兜底。

### POST /api/mp/orders/:id/pay
拉起微信支付，返回小程序支付参数。
- req: `{ }`（可选 `"payScene"`）
- resp `data`: `{ "payParams": { timeStamp, nonceStr, package:"prepay_id=...", signType:"RSA", paySign } }`
- 行为：后端调微信 V3 JSAPI 下单（金额转分），返回签名参数供 `uni.requestPayment` 调用。

### GET /api/mp/orders?status=pending&page=1&size=10
我的订单（按时间倒序）。`status` 可空（全部）。
- resp `data.list[]`: `{ id, orderNo, projectId, projectTitle, projectCover, amount, status, statusLabel, createdAt, paidAt }`

### GET /api/mp/orders/:id
订单详情。
- resp `data`: `{ id, orderNo, project{...}, participant{...}, amount, status, statusLabel, paidAt, transactionId, refundStatus, refundedAt, createdAt }`

### POST /api/mp/orders/:id/cancel
取消待支付订单（仅 `pending` 可取消；待支付不锁名额，无需回补）。
- resp `data`: `{ id, status: "cancelled" }`

## 状态枚举（与 packages/shared 一致）
- order.status: `pending` 待支付 / `confirmed` 已报名 / `refunded` 已退款 / `cancelled` 已取消
- projectStatusLabel: 报名中 / 即将截止 / 名额已满 / 报名已截止 / 已下架（小程序仅见 published）
