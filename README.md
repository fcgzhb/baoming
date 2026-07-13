# baoming — 旅游游学项目报名小程序平台

微信小程序（uni-app）+ 后台管理（Vue 3 + Element Plus）+ Node.js 后端（NestJS + TypeORM + MySQL），pnpm workspaces monorepo。

> 设计文档见 [`specs/001-tour-signup-platform/`](./specs/001-tour-signup-platform/)（spec / plan / data-model / contracts / tasks）。

## 结构

```
baoming/
├── apps/
│   ├── server/   # NestJS + TypeORM + MySQL（后端 + 微信支付/退款）
│   ├── admin/    # Vue 3 + Element Plus + Vite（后台管理）
│   └── mp/       # uni-app → 微信小程序（见 apps/mp/README.md，需单独 bootstrap）
├── packages/
│   └── shared/   # 跨端枚举/类型/常量
└── specs/        # speckit 设计产物
```

## 技术栈

- **server**: NestJS 10 + TypeScript + TypeORM + MySQL 8 + JWT(Passport) + bcryptjs + class-validator + wechatpay-node-v3
- **admin**: Vue 3 + Element Plus + Vite + Pinia + Vue Router
- **mp**: uni-app (Vue 3) → 微信小程序
- **工程**: pnpm workspaces monorepo

## 快速开始

### 前置
- Node 20+、pnpm 9+、MySQL 8

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量
```bash
cp .env.example apps/server/.env
# 编辑 apps/server/.env：DB、JWT_SECRET、微信 AppID/Secret、支付商户配置
```

### 3. 数据库 + 管理员
```bash
mysql -uroot -p -e "CREATE DATABASE baoming DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
pnpm --filter @baoming/server migration:generate -- src/migrations/Init
pnpm migration:run
pnpm seed:admin          # 用 .env 中的 SEED_ADMIN_* 注入首个管理员
```

### 4. 启动
```bash
pnpm dev:server          # http://localhost:3000/api  (健康检查: /api/health)
pnpm dev:admin           # http://localhost:5173
```

小程序端见 [`apps/mp/README.md`](./apps/mp/README.md)（需经官方模板 bootstrap @dcloudio 依赖）。

## 当前进度

- ✅ Phase 1 Setup：monorepo + shared + server/admin/mp 骨架
- ✅ Phase 2 Foundational：TypeORM+MySQL、7 实体、响应信封/异常过滤/校验、JWT、健康检查、管理员种子、US2 登录
- ⏭️ 下一步：US5 后台项目 CRUD → US1 浏览 → US3 报名+支付（MVP 主链路），详见 [`tasks.md`](./specs/001-tour-signup-platform/tasks.md)

## 关键设计

- **名额防超卖**：支付回调原子 `UPDATE projects SET registered_count=registered_count+1 WHERE id=? AND registered_count<total_quota`（受影响行=0 即退款）。
- **同项目同证件号唯一**：`orders.active_key` 生成列 + 唯一索引（MySQL 忽略 NULL）。
- **统一响应**：`{ code, msg, data }`；微信回调验签+幂等。
