# baoming — 旅游游学项目报名小程序平台

微信小程序（uni-app）+ 后台管理（Vue 3 + Element Plus）+ Node.js 后端（NestJS + TypeORM + MySQL），pnpm workspaces monorepo。支持微信授权登录、游学项目浏览/报名、微信支付、后台项目管理与订单退款。

> 设计文档：[`specs/001-tour-signup-platform/`](./specs/001-tour-signup-platform/)（spec / plan / data-model / contracts / tasks）

## 目录结构

```
baoming/
├── apps/
│   ├── server/   # NestJS + TypeORM + MySQL（后端 + 微信支付/退款 + COS 上传）
│   ├── admin/    # Vue 3 + Element Plus + Vite（后台管理）
│   └── mp/       # uni-app（Vue 3）→ 微信小程序
├── packages/
│   └── shared/   # 跨端枚举/类型/常量（双格式 CJS+ESM）
├── docker-compose.yml + apps/{server,admin}/Dockerfile
└── specs/        # speckit 设计产物
```

## 技术栈

- **server**: NestJS 10 · TypeScript · TypeORM · MySQL 8 · JWT(Passport) · bcryptjs · class-validator · wechatpay-node-v3 · cos-nodejs-sdk-v5 · qcloud-cos-sts · sanitize-html · @nestjs/throttler
- **admin**: Vue 3 · Element Plus · Vite · Pinia · Vue Router
- **mp**: uni-app（Vue 3）→ 微信小程序
- **工程**: pnpm workspaces monorepo

## 功能（6 个用户故事）

| 模块 | 说明 |
|---|---|
| US1 浏览 | 小程序首页/详情展示后台已上架游学项目（名额、截止时间） |
| US2 登录 | 微信授权登录（code2session）+ 手机号 + 敏感信息授权同意 |
| US3 报名+支付 | 填写参团人信息 → 微信支付 → 原子扣名额（防超卖）→ 超卖自动退款 → 掉单补单 |
| US4 我的订单 | 订单列表/详情，待支付可继续支付/取消 |
| US5 后台项目 | 项目 CRUD / 上下架（管理员） |
| US6 后台订单/用户 | 订单筛选/详情/全额退款、用户列表/详情 |

## 快速开始（本地）

**前置**：Node 20+、pnpm 9+、MySQL 8。

```bash
pnpm install

# 配置环境变量（DB / JWT / 微信 / COS）
cp .env.example apps/server/.env
# 编辑 apps/server/.env

# 数据库 + 管理员
mysql -uroot -p -e "CREATE DATABASE baoming DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
pnpm --filter @baoming/server migration:generate src/migrations/Init
pnpm migration:run
pnpm seed:admin          # 用 SEED_ADMIN_* 注入首个管理员

# 启动
pnpm dev:server          # http://localhost:3000/api  (健康检查: /api/health)
pnpm dev:admin           # http://localhost:5173      (admin/admin123)
```

小程序：`pnpm dev:mp-weixin` → 用「微信开发者工具」导入 `apps/mp/dist/dev/mp-weixin`，填 `apps/mp/src/manifest.json` 的 `mp-weixin.appid`。

## 部署（Docker）

```bash
docker compose up --build -d
# server -> :3000, admin(nginx) -> :5173
```

- `apps/server/.env` 作为 server 容器的 `env_file`。
- 容器需访问宿主 MySQL：`.env` 设 `DB_HOST=host.docker.internal`（compose 已加 `host.docker.internal:host-gateway`）。
- admin 的 nginx 把 `/api/` 反代到 `server:3000`。
- 微信支付回调需**公网 HTTPS 域名**指向 server 的 `/api/wechat/*`。

## 图片上传（腾讯云 COS）

两种模式，均**不向客户端暴露主密钥**：

**A. 后端代理上传（默认，已验证）**：`POST /api/admin/upload/image`（multipart `file`）→ 后端用主密钥 `putObject` → 返回公开 URL。admin 项目编辑页封面图即用此方式。

**B. STS 临时凭证直传（生产推荐）**：`GET /api/admin/upload/sts-credentials` 返回 30 分钟有效的 scoped 临时密钥（限 `uploads/projects/*` 的 PutObject/PostObject）。前端用 `cos-js-sdk-v5` 直传，主密钥永不下发。

env（`.env`）：
```
UPLOAD_DRIVER=cos
COS_SECRET_ID=...        # 真实密钥只放 .env（gitignored）
COS_SECRET_KEY=...
COS_BUCKET=baoming-1254292923
COS_REGION=ap-beijing
```

> **启用 B（浏览器直传）需在 COS 控制台配置 CORS**：允许来源（admin 域名）、方法 PUT/POST/GET、头 `Content-Type, x-cos-security-token`。前端集成示例：
> ```ts
> import COS from 'cos-js-sdk-v5';
> const cos = new COS({
>   getAuthorization: async (_o, cb) => {
>     const r = await fetch('/api/admin/upload/sts-credentials', { headers: { Authorization: `Bearer ${token}` } });
>     const d = (await r.json()).data;
>     cb({ TmpSecretId: d.tmpSecretId, TmpSecretKey: d.tmpSecretKey, SecurityToken: d.sessionToken, StartTime: d.startTime, ExpiredTime: d.expiredTime });
>   },
> });
> await cos.putObject({ Bucket: d.bucket, Region: d.region, Key: `uploads/projects/${Date.now()}.png`, Body: file });
> ```

## 微信配置（联调登录/支付时填）

`.env`：
```
WX_APP_ID=...            # 小程序 AppID
WX_APP_SECRET=...
WXPAY_MCH_ID=...         # 商户号
WXPAY_API_V3_KEY=...     # APIv3 密钥
WXPAY_CERT_SERIAL_NO=... # 商户证书序列号
WXPAY_PRIVATE_KEY_PATH=./certs/apiclient_key.pem
WXPAY_CERT_PATH=./certs/apiclient_cert.pem
WXPAY_NOTIFY_URL=https://<公网域名>/api/wechat/pay/notify
WXPAY_REFUND_NOTIFY_URL=https://<公网域名>/api/wechat/refund/notify
```

未填这些时服务端可正常启动（后台/项目/浏览/订单非支付路径可用）；微信相关调用会 fail-fast「未配置」。

## 关键设计

- **名额防超卖**：支付回调内 `UPDATE projects SET registered_count=registered_count+1 WHERE id=? AND registered_count<total_quota`，受影响行=0 即超卖 → 原路退款。
- **同项目同证件号唯一**：`orders.active_key` STORED 生成列（pending/confirmed 时 = `projectId:idCard`，否则 NULL）+ 唯一索引。
- **统一响应**：`{ code, msg, data }`；微信回调用 `@Res()` 返回 `{code:'SUCCESS'}`，验签 + AES 解密 + 幂等。
- **安全**：登录限流（5/min）、JWT、bcrypt、管理员登录账号锁定、富文本 `sanitize-html` 清洗、COS 主密钥仅在服务端、STS 临时凭证。

## 安全提醒

- `apps/server/.env` 已被 `.gitignore` 忽略——**真实密钥（DB/微信/COS）只放这里**，绝不提交。
- 微信商户证书（`certs/*.pem`）也已忽略。
- 生产环境：COS 用**子账号 + STS**（而非主账号密钥）；微信支付证书与回调域名走 HTTPS；轮换开发期泄露过的密钥。

## API 概览

详见 `specs/001-tour-signup-platform/contracts/`。前缀 `/api`：
- 小程序（用户 JWT）：`/mp/auth/*`、`/mp/projects`、`/mp/orders`、`/mp/user/profile`
- 后台（管理员 JWT）：`/admin/auth/*`、`/admin/projects`、`/admin/orders`、`/admin/users`、`/admin/upload/*`
- 微信回调（验签）：`/wechat/pay/notify`、`/wechat/refund/notify`

## 常用脚本

```bash
pnpm dev:server | dev:admin | dev:mp-weixin
pnpm build                  # shared + 所有 apps
pnpm migration:generate -- src/migrations/<Name>   # 仅 server（需 DB 在线）
pnpm migration:run
pnpm seed:admin
pnpm test                   # 各工作区测试
```
