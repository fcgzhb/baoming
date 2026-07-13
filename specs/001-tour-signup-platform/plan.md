# Implementation Plan: 旅游游学项目报名小程序平台

**Branch**: `001-tour-signup-platform` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-tour-signup-platform/spec.md`

## Summary

微信小程序（用户端）+ Web 后台（管理员）+ Node.js 后端的**旅游游学项目报名平台**。核心闭环：后台发布游学项目 → 小程序用户微信授权登录 → 浏览详情 → 填写参团人信息 → 微信支付 → 支付成功即报名确认（原子扣减名额，防超卖）→ 后台查看订单 / 发起在线退款（原路退回）。

技术路线（用户已确认）：**NestJS + TypeScript** 后端，**TypeORM** 接 **MySQL**；**uni-app（Vue 3）** 构建微信小程序；**Vue 3 + Element Plus** 后台；三者 + 共享类型包置于 **pnpm workspaces 单仓库**。微信支付/退款走 `wechatpay-node-v3` 官方 SDK；登录走 `code2session`。

## Technical Context

**Language/Version**: TypeScript 5.x（后端 NestJS；前端 Vue 3 + Vite；小程序 uni-app）
**Primary Dependencies**:
- 后端：NestJS 10、TypeORM、`mysql2`、`@nestjs/jwt` + `passport-jwt`、`class-validator`/`class-transformer`、`wechatpay-node-v3`（微信支付 v3）、`@nestjs/config`、`dayjs`
- 小程序：uni-app（Vue 3）、Pinia、`uni.request` 封装、微信支付/登录原生能力
- 后台：Vue 3、Element Plus、Vite、Pinia、Vue Router、Axios
- 共享：`packages/shared`（DTO/枚举/常量，如订单状态机）
**Storage**: MySQL 8.0（utf8mb4）；图片/封面存对象存储（默认腾讯云 COS，待用户确认账号）
**Testing**: Jest（后端单元/集成）；Vitest（前端/后台单元）；契约测试对照 `contracts/`；小程序以 HBuilderX/微信开发者工具手动 + 关键流程脚本
**Target Platform**: 后端 Linux 服务器（Node 20+）；小程序微信平台；后台现代浏览器
**Project Type**: web-service + mobile-app（小程序）+ admin SPA 的 monorepo
**Performance Goals**: 首页项目列表 p95 < 1s（SC-002）；支付回调到订单确认 < 10s（SC-004）；并发抢名额零超卖（SC-003）
**Constraints**:
- 名额并发安全：支付成功时原子扣减（行级 `UPDATE ... WHERE registered_count < total_quota` + 受影响行数校验）
- 订单状态机：待支付 → 已报名（支付成功）/ 已取消；已报名 → 已退款（全额）
- 同项目同证件号唯一（生成列 + 唯一索引兜底，见 data-model.md）
- v1 全额退款、不做导出、不做订阅消息、不做动态表单（见 spec Assumptions）
- 微信支付/退款回调必须验签 + 幂等
**Scale/Scope**: v1 面向中小型游学机构；预估项目数 < 200、并发报名峰值 < 500 QPS、用户量 5 万级；50 以内 API 端点

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**结果：AUTO-PASS（无约束可校验）**

`.specify/memory/constitution.md` 仍为**未填写的模板**（`[PRINCIPLE_1_NAME]` 等占位符均未替换），即项目尚未批准任何宪法原则。因此无项目级质量门可执行，Phase 0/1 不存在违反。

> 建议：在合适时机运行 `/speckit.constitution` 落地一份宪法（建议至少包含：测试要求、安全/密钥管理、提交规范、可观测性），后续 `/speckit.plan` 会据此自动校验。

## Project Structure

### Documentation (this feature)

```text
specs/001-tour-signup-platform/
├── spec.md               # /speckit.specify 产物（含 7 条澄清）
├── checklists/
│   └── requirements.md   # 规格质量清单
├── plan.md               # 本文件（/speckit.plan 产物）
├── research.md           # Phase 0：技术决策与替代方案
├── data-model.md         # Phase 1：实体、字段、关系、状态机、DDL
├── quickstart.md         # Phase 1：本地启动指南
├── contracts/            # Phase 1：REST API + 微信回调契约
│   ├── README.md
│   ├── mini-program.md   # 小程序端 API
│   ├── admin.md          # 后台 API
│   └── wechat-callbacks.md
└── tasks.md              # Phase 2（/speckit.tasks 生成，本命令不创建）
```

### Source Code (repository root)

```text
baoming/                         # pnpm workspaces 单仓库
├── package.json                 # 根脚本（dev/build/lint/migrate 聚合）
├── pnpm-workspace.yaml          # packages: apps/*, packages/*
├── tsconfig.base.json           # 共享 TS 配置
├── .env.example                 # 汇总环境变量样例
├── apps/
│   ├── server/                  # NestJS + TypeORM 后端
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/          # 配置加载（@nestjs/config）
│   │   │   ├── common/          # guards/jwt、interceptors、filters、decorators
│   │   │   ├── database/        # TypeORM 配置、entities/、migrations/
│   │   │   └── modules/
│   │   │       ├── auth/            # 微信登录(code2session)、手机号、管理员登录、JWT 签发
│   │   │       ├── users/           # 用户资料
│   │   │       ├── projects/        # 游学项目 CRUD + 上下架
│   │   │       ├── orders/          # 报名下单、名额校验、列表、取消
│   │   │       ├── participants/    # 参团人固定字段
│   │   │       ├── payment/         # 微信支付下单(prepare)、notify 回调
│   │   │       ├── refund/          # 全额退款、refund-notify 回调
│   │   │       ├── consent/         # 敏感信息授权同意记录
│   │   │       ├── audit/           # 操作日志
│   │   │       └── admin/           # 管理员账号
│   │   ├── test/                # Jest 单元/集成/e2e
│   │   └── package.json
│   ├── admin/                   # Vue 3 + Element Plus + Vite 后台
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── App.vue
│   │   │   ├── router/          # 路由 + 登录守卫
│   │   │   ├── stores/          # Pinia（auth 等）
│   │   │   ├── api/             # axios 封装，对接 contracts/admin.md
│   │   │   ├── views/           # login / projects / project-edit / orders / order-detail / users / user-detail
│   │   │   ├── components/
│   │   │   └── utils/
│   │   ├── vite.config.ts       # dev proxy → server
│   │   └── package.json
│   └── mp/                      # uni-app → 编译为微信小程序
│       ├── src/
│       │   ├── main.ts
│       │   ├── pages.json       # 页面注册 + tabBar
│       │   ├── manifest.json    # AppID 等
│       │   ├── pages/           # index / detail / enroll / orders / order-detail / profile / login
│       │   ├── components/
│       │   ├── api/             # 对接 contracts/mini-program.md
│       │   ├── stores/          # Pinia（user/token）
│       │   └── utils/           # request 拦截器、微信支付/登录封装
│       └── package.json
├── packages/
│   └── shared/                  # 跨端共享：DTO、枚举（OrderStatus 等）、常量、zod/class-validator schema
│       ├── src/
│       └── package.json
└── .specify/                    # speckit 脚手架（已存在）
```

**Structure Decision**: 采用 **pnpm workspaces monorepo**（用户明确要求前后端同目录）。3 个应用（`apps/server`、`apps/admin`、`apps/mp`）+ 1 个共享包（`packages/shared`，承载订单状态机、DTO 与校验 schema，避免三端重复定义）。选 pnpm workspaces 而非 Turborepo/Nx，因其零额外运行时、足以支撑当前规模（见 research.md）。

## Complexity Tracking

> 本特性 Constitution Check 为 AUTO-PASS，无违反需正当化，故此表留空。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
