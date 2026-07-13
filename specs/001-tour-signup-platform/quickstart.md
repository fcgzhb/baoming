# Quickstart（本地启动指南）

**Feature**: 旅游游学项目报名小程序平台 · **Monorepo**: pnpm workspaces
对应架构见 [plan.md](./plan.md)，技术决策见 [research.md](./research.md)。

## 0. 前置依赖

| 工具 | 版本 | 用途 |
|---|---|---|
| Node.js | 20 LTS+ | 后端/前端运行时 |
| pnpm | 9+ | monorepo 包管理 |
| MySQL | 8.0+ | 数据库（utf8mb4） |
| 微信开发者工具 | 最新 | 运行/调试小程序（uni-app 编译产物） |
| HBuilderX（可选） | 最新 | uni-app 开发体验 |

> 微信支付/登录需：小程序 AppID + AppSecret；微信支付商户号 + APIv3 密钥 + 商户证书（`apiclient_cert.pem` / `apiclient_key.pem`）+ 平台证书。本地无商户资质时，可用沙箱或 mock 模式先跑通非支付链路。

## 1. 安装依赖

```bash
# 仓库根目录
pnpm install
```

工作区：`apps/server`、`apps/admin`、`apps/mp`、`packages/shared`。

## 2. 环境变量

复制样例并填写：
```bash
cp .env.example apps/server/.env
```

`apps/server/.env` 关键项（**密钥严禁入仓**）：
```env
NODE_ENV=development
PORT=3000

# MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=baoming
DB_PASSWORD=change-me
DB_NAME=baoming

# JWT
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=7d

# 微信小程序
WX_APP_ID=wx...
WX_APP_SECRET=...

# 微信支付 (V3)
WXPay_MCH_ID=...
WXPay_API_V3_KEY=...
WXPay_APP_ID=wx...            # 一般同小程序 AppID
WXPay_NOTIFY_URL=https://<公网域名>/api/wechat/pay/notify
WXPay_REFUND_NOTIFY_URL=https://<公网域名>/api/wechat/refund/notify
WXPay_CERT_SERIAL_NO=...
WXPay_PRIVATE_KEY_PATH=./certs/apiclient_key.pem
WXPay_PLATFORM_CERT_PATH=./certs/wxpay_pub.pem

# 初始管理员（种子）
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=change-me
SEED_ADMIN_DISPLAY_NAME=超管

# 对象存储（默认腾讯云 COS；未配置则回退本地 /uploads）
UPLOAD_DRIVER=local          # local | cos
# COS_SECRET_ID=... COS_SECRET_KEY=... COS_BUCKET=... COS_REGION=ap-guangzhou
```

## 3. 数据库初始化

```bash
# 建库（utf8mb4）
mysql -uroot -p -e "CREATE DATABASE baoming DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 运行 TypeORM 迁移（生成表）
pnpm --filter server migration:run

# 注入首个管理员
pnpm --filter server seed:admin
```

> 开发期可用 `pnpm --filter server migration:generate -- -n Init` 依据实体生成迁移；实体见 [data-model.md](./data-model.md)。

## 4. 启动后端

```bash
pnpm --filter server dev     # http://localhost:3000/api
```
- 健康检查：`GET /api/health`（建议提供）。
- 后台与小程序均通过此 Base URL 访问。

## 5. 启动后台（Vue3 + Element Plus）

```bash
pnpm --filter admin dev      # http://localhost:5173
```
- `vite.config.ts` 配置 `/api` 代理到 `http://localhost:3000`，避免跨域。
- 用步骤 3 的种子管理员登录。

## 6. 启动小程序（uni-app）

```bash
pnpm --filter mp dev:mp-weixin   # 产物输出至 apps/mp/dist/dev/mp-weixin
```
- 用**微信开发者工具**导入 `apps/mp/dist/dev/mp-weixin` 目录运行。
- 在小程序后台配置 `request 合法域名`（开发期可在微信工具勾选「不校验合法域名」）。
- `manifest.json` 填入 `WX_APP_ID`。

### 本地联调微信支付的说明
微信支付回调需**公网 HTTPS**，本地开发可选：
- 内网穿透（如 cpolar/frp）暴露 `:3000` 到 HTTPS 域名，填入 `*_NOTIFY_URL`；
- 或先用「查单/补单」与 mock 支付跑通主链路，真实回调在测试环境验证。

## 7. 跑通核心闭环（冒烟）

1. 后台登录 → 新建并**上架**一个游学项目（设名额、价格、截止时间）。
2. 小程序授权登录 → 授权手机号 → 首页看到项目 → 进入详情。
3. 「立即报名」填写参团人信息 → 创建订单（待支付）。
4. 拉起微信支付 → 支付成功 → 「我的订单」出现「已报名」。
5. 后台「订单管理」筛出该订单 → 发起全额退款 → 订单转「已退款」、名额释放。
6. 验证并发：构造最后 1 名额并发 2 单 → 仅 1 单成功、另 1 单自动退款（集成测试见 tasks）。

## 8. 测试

```bash
pnpm --filter server test        # Jest：单元 + 集成（名额并发、回调验签幂等、状态机）
pnpm --filter admin test         # Vitest
pnpm --filter shared test
```

## 9. 常见问题

- **回调验签失败**：检查 APIv3 密钥与平台证书是否最新（微信会轮换平台证书）。
- **手机号/登录拿不到**：确认 AppID/AppSecret、小程序与后端同主体；本地用微信开发者工具登录。
- **金额不一致**：后端与微信一律以「分」交互，DB 以 `DECIMAL(10,2)`（元）；见 research.md D12。
- **同证件号重复报名**：业务订单提示「该参团人已报名」；若需重新报名，先取消/退款原订单（active_key 置 NULL）。
