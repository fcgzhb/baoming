# Tasks: 旅游游学项目报名小程序平台

**Input**: Design documents from `/specs/001-tour-signup-platform/`（plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md）
**Stack**: NestJS+TypeORM+MySQL (server) · uni-app (mp) · Vue3+Element Plus (admin) · pnpm workspaces monorepo
**Branch**: `001-tour-signup-platform`

**Tests**: 按项目 TDD 规范**包含**关键测试任务（契约/集成/单元）。若希望「先实现后补测」，可延后各 `Tests` 子任务，但**不得跳过**：名额并发、支付/退款回调幂等、订单状态机（SC-003/SC-004/SC-005）。

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[USx]**: 归属用户故事（US1–US6）
- 所有任务含具体文件路径；`apps/server`、`apps/admin`、`apps/mp`、`packages/shared` 为 monorepo 工作区。

---

## Phase 1: Setup（共享基础设施）

**Purpose**: monorepo 骨架与依赖初始化

- [ ] T001 Create monorepo root: `package.json`、`pnpm-workspace.yaml`（packages: `apps/*`,`packages/*`）、`tsconfig.base.json`、`.editorconfig`、根 `.env.example`
- [ ] T002 [P] Scaffold workspaces：`apps/server`(NestJS)、`apps/admin`(Vite+Vue3+Element Plus)、`apps/mp`(uni-app)、`packages/shared`
- [ ] T003 [P] Configure ESLint+Prettier+tsconfig 各工作区；根脚本 `dev`/`build`/`lint`/`test` 聚合
- [ ] T004 Configure `apps/admin/vite.config.ts`(`/api`→`:3000` 代理) 与 `apps/mp` 的 `manifest.json`/`pages.json` 骨架

---

## Phase 2: Foundational（阻塞性前置）

**Purpose**: 所有用户故事都依赖的核心设施。⚠️ 完成前不得开始任何故事。

- [ ] T005 [P] `packages/shared`：枚举（`OrderStatus`/`ProjectStatus`/`IdCardType`/`RefundStatus`）、响应信封类型、DTO、常量
- [ ] T006 `apps/server/src/config`：`@nestjs/config` + 环境变量校验（class-validator）
- [ ] T007 `apps/server/src/database`：TypeORM MySQL 连接 + DataSource 配置
- [ ] T008 `apps/server/src/database/entities`：全部 7 实体（users/admins/projects/participants/orders/consent_records/audit_logs），含字段、索引、关系（见 data-model.md）
- [ ] T009 生成并运行初始迁移：建表 + 生成列 `orders.active_key` + 唯一索引（`uk_orders_active_key` 等）
- [ ] T010 全局响应拦截器（`code/msg/data`）+ 全局异常过滤器（错误码映射 4001/4003/4090/4220/5000）于 `apps/server/src/common`
- [ ] T011 全局 `ValidationPipe`（whitelist/transform/class-validator）
- [ ] T012 [P] JWT 模块 + `JwtAuthGuard` + user/admin 角色策略 + `@CurrentUser`/`@Roles` 装饰器 + `PasswordHasher`(bcrypt) 于 `apps/server/src/common`
- [ ] T013 [P] 结构化日志（pino/winston）+ 请求日志 + `AuditLogService` 骨架于 `apps/server/src/modules/audit`
- [ ] T014 种子脚本 `pnpm --filter server seed:admin`（env 注入首个管理员，bcrypt）
- [ ] T015 [P] `GET /api/health` 健康检查端点

**Checkpoint**: 基础设施就绪，各用户故事可并行/按序开始。

---

## Phase 3: User Story 2 — 微信授权登录 (Priority: P1)

**Goal**: 用户经微信授权登录，系统识别身份（openid），可授权手机号与敏感信息同意。
**Independent Test**: 小程序登录 → 后端识别 openid 并签发 token；授权手机号写回；同意记录可查。

### Tests (US2)
- [ ] T016 [P] [US2] 契约测试：`POST /api/mp/auth/login`、`/phone`、`/consent` 于 `apps/server/test/auth.e2e-spec.ts`
- [ ] T017 [P] [US2] 单元测试：`AuthService` 的 code2session upsert 于 `apps/server/src/modules/auth/auth.service.spec.ts`

### Implementation (US2)
- [ ] T018 [US2] `AuthService` + 微信 `code2session` 客户端 + 用户 upsert 于 `apps/server/src/modules/auth`
- [ ] T019 [US2] `AuthController`：`login`/`phone`(getPhoneNumber 换号)/`consent` 端点（对齐 contracts/mini-program.md）
- [ ] T020 [US2] `UsersController` `GET /api/mp/user/profile`
- [ ] T021 [US2] `apps/mp`：`utils/request`(token 注入+401 重登) + `stores/user`(Pinia)
- [ ] T022 [US2] `apps/mp`：`pages/login` + `pages/profile`；报名前的「敏感信息同意」闸门（FR-014）

**Checkpoint**: 登录闭环可独立验证。

---

## Phase 4: User Story 5 — 后台项目维护 (Priority: P1)

**Goal**: 管理员登录后可创建/编辑/上下架游学项目。
**Independent Test**: 管理员登录 → 新建项目 → 上架 → DB 存在 `status=published` 记录。

### Tests (US5)
- [ ] T023 [P] [US5] 契约测试：后台项目 CRUD + publish/offline 于 `apps/server/test/projects-admin.e2e-spec.ts`

### Implementation (US5)
- [ ] T024 [US5] 管理员登录端点（bcrypt 校验 + admin JWT）于 `apps/server/src/modules/admin`
- [ ] T025 [US5] `ProjectsService`+`ProjectsController`(admin)：CRUD/publish/offline/软删除 + 所有权 + 校验 + 上下架状态约束 于 `apps/server/src/modules/projects`
- [ ] T026 [US5] `apps/admin`：axios 封装 + auth store + 路由登录守卫 + `views/login`
- [ ] T027 [P] [US5] `apps/admin`：`views/projects`(表格+筛选) + `views/project-edit`(表单，Element Plus)

**Checkpoint**: 后台内容供给侧可独立验证（为 US1 提供数据）。

---

## Phase 5: User Story 1 — 浏览游学项目 (Priority: P1) 🎯 MVP

**Goal**: 小程序用户浏览已上架项目（列表+详情）。
**Independent Test**: 后台发布一项目后，小程序首页可见卡片，详情页展示完整信息与名额/截止状态。

### Tests (US1)
- [ ] T028 [P] [US1] 契约测试：`GET /api/mp/projects`、`/:id` 于 `apps/server/test/projects-mp.e2e-spec.ts`

### Implementation (US1)
- [ ] T029 [US1] `ProjectsService`(公开)：列表(仅 published 且未截止) + 详情 + `enrollable`/`remainingQuota` 计算于 `apps/server/src/modules/projects`
- [ ] T030 [US1] `apps/mp`：`pages/index`(项目卡片) + `pages/detail`(富文本渲染、名额/截止提示、报名按钮 gating)

**Checkpoint**: 核心浏览闭环可独立演示。

---

## Phase 6: User Story 3 — 报名信息 + 微信支付 (Priority: P1)

**Goal**: 用户填写参团人信息、微信支付成功即确认（原子扣减名额，防超卖）。
**Independent Test**: 报名→支付→订单「已报名」且名额 +1；并发抢最后名额仅 1 人成功、余者自动退款。

### Tests (US3)
- [ ] T031 [P] [US3] 单元/集成测试：名额原子扣减（受影响行=0/1）、订单状态机、同证件号唯一性 于 `apps/server/test/orders.quota.spec.ts`
- [ ] T032 [P] [US3] 契约测试：`POST /orders`、`/:id/pay`、`pay/notify` 于 `apps/server/test/orders-pay.e2e-spec.ts`

### Implementation (US3)
- [ ] T033 [US3] `ParticipantsService` + `OrdersService.create`：校验 enrollable、应用层唯一性检查、金额锁定、事务写入（冗余 `participant_id_card`）于 `apps/server/src/modules/orders`
- [ ] T034 [US3] `PaymentService`：`wechatpay-node-v3` JSAPI 下单（金额转分）+ `OrdersController` create/pay 于 `apps/server/src/modules/payment`
- [ ] T035 [US3] 微信支付回调 `POST /api/wechat/pay/notify`：验签+解密、幂等、金额校验、原子 `UPDATE projects ... WHERE registered_count<total_quota`、超卖即退款
- [ ] T036 [US3] `apps/mp`：`pages/enroll`(参团人表单，按证件类型校验) + 支付调起(`uni.requestPayment`)
- [ ] T037 [US3] 掉单兜底：定时/手动「查单」对超时 `pending` 订单调 V3 查询补单或关单（FR-013）于 `apps/server/src/modules/orders/reconcile.service.ts`

**Checkpoint**: 商业收银闭环可独立验证（SC-003 零超卖）。

---

## Phase 7: User Story 4 — 我的订单 (Priority: P2)

**Goal**: 用户查看自己的报名订单及状态，可继续支付/取消待支付订单。
**Independent Test**: 完成至少一笔订单后，「我的订单」可见并按状态筛选；待支付订单可取消（释放逻辑：待支付不锁名额）。

### Tests (US4)
- [ ] T038 [P] [US4] 契约测试：`GET /orders`、`/:id`、`POST /:id/cancel` 于 `apps/server/test/orders-mp.e2e-spec.ts`

### Implementation (US4)
- [ ] T039 [US4] `OrdersService`：我的订单列表/详情 + 取消（仅 `pending→cancelled`）于 `apps/server/src/modules/orders`
- [ ] T040 [US4] `apps/mp`：`pages/orders`(状态 Tab) + `pages/order-detail` + 继续支付/取消操作

**Checkpoint**: 用户自助订单闭环可独立验证。

---

## Phase 8: User Story 6 — 后台订单 / 在线退款 (Priority: P1/P2)

**Goal**: 管理员筛选查看订单与用户，对已支付订单发起全额在线退款；退款回调释放名额。
**Independent Test**: 后台筛出某项目订单 → 发起退款 → 回调成功后订单「已退款」且名额 -1。

### Tests (US6)
- [ ] T041 [P] [US6] 契约测试：后台订单 list/detail/refund + `refund/notify` 于 `apps/server/test/orders-admin.e2e-spec.ts`

### Implementation (US6)
- [ ] T042 [US6] `AdminOrdersService`：列表/详情/筛选 + 发起全额退款（`wechatpay-node-v3` V3 退款接口）于 `apps/server/src/modules/orders`
- [ ] T043 [US6] 微信退款回调 `POST /api/wechat/refund/notify`：验签、幂等、`confirmed→refunded` + 名额释放（先判状态再 `registered_count-1`）、异常处理
- [ ] T044 [P] [US6] `AdminUsersService`：用户列表/详情 + `orderCount` 聚合 于 `apps/server/src/modules/users`
- [ ] T045 [P] [US6] `apps/admin`：`views/orders`(筛选: 项目/状态/手机号/姓名/订单号) + `views/order-detail` + 退款操作
- [ ] T046 [P] [US6] `apps/admin`：`views/users` + `views/user-detail`

**Checkpoint**: 运营与售后闭环可独立验证（SC-005 资金/状态一致）。

---

## Phase 9: Polish & Cross-Cutting

- [ ] T047 [P] 名额并发压测（SC-003 零超卖）于 `apps/server/test/quota.stress.spec.ts`
- [ ] T048 [P] 安全加固：限流、helmet、CORS、密钥仅 env 审计（对照 security 清单）
- [ ] T049 [P] 操作日志贯穿：publish/offline/delete/refund/pay_confirmed/refund_confirmed 写 `audit_logs`（FR-108）
- [ ] T050 按 `quickstart.md` 跑端到端冒烟验证（后台发布→浏览→报名→支付→退款）
- [ ] T051 根 `README.md` + 部署说明（Docker/compose 草案，含微信回调 HTTPS 域名要求）
- [ ] T052 [P] 图片上传集成（腾讯云 COS 或本地 `/uploads`）用于项目封面/图文（research.md D13）

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 Setup**：无依赖，立即开始。
- **Phase 2 Foundational**：依赖 Phase 1；**阻塞所有用户故事**。
- **Phase 3–8（用户故事）**：均依赖 Phase 2 完成；可并行（多人）或按下列依赖顺序串行。
- **Phase 9 Polish**：依赖目标用户故事完成。

### 用户故事依赖（实现顺序建议）
- **US2 登录**(P1)：Phase 2 后即可开始；为所有需身份的操作提供 JWT。（最先做）
- **US5 后台项目**(P1)：依赖管理员登录（T024）；为 US1/US3 提供项目数据。
- **US1 浏览**(P1)：依赖 projects（US5 的数据）；浏览本身不需登录，但「立即报名」跳转需 US2。
- **US3 报名+支付**(P1)：依赖 US2(身份) + projects(US5/US1) + 支付设施。
- **US4 我的订单**(P2)：依赖 orders（US3 产出）。
- **US6 后台订单/退款**(P1/P2)：依赖 orders+支付（US3）。

> 优先级（spec）与实现顺序不同：P1 故事须先交付，但实现上 US2→US5→US1→US3 是最小可运行链路。

### 故事内顺序
测试（若启用）先写并失败 → 实体已在 Phase 2 → 服务 → 端点/UI → 集成 → 故事完成后进入下一优先级。

### Parallel Opportunities
- Phase 1/2 中所有 `[P]` 任务可并行。
- Phase 2 完成后，US2/US5 可同时启动；US1 待 US5 数据；US3 待 US2；US4/US6 待 US3。
- 同故事内 `[P]` 的测试/模型/独立视图可并行。
- 不同故事可由不同人并行（前端 mp / 前端 admin / 后端 三条线）。

---

## Parallel Example: User Story 3

```bash
# 并行：US3 的测试
Task T031: 名额原子扣减/状态机/唯一性 单元集成测试
Task T032: orders/pay 契约测试

# 串行后并行：实现
Task T033: OrdersService.create（依赖 Phase 2 实体）
  → Task T034: PaymentService（依赖 T033）
  → Task T035: pay/notify 回调（依赖 T034）
  → Task T036: mp enroll/pay 页面（可与 T034/T035 并行，不同仓库）
```

---

## Implementation Strategy

### MVP First（建议首版交付：US2 + US5 + US1 + US3）
1. Phase 1 Setup → Phase 2 Foundational（**关键阻塞**）
2. US2 登录 → US5 后台项目 → US1 浏览 → US3 报名+支付
3. **STOP 验证**：跑通「后台发布→小程序浏览→报名→支付→订单确认」主闭环
4. 可演示/部署 MVP

### Incremental Delivery
- MVP 后依次加 US4（我的订单）→ US6（退款）→ Polish
- 每个故事独立可测，不破坏前序功能

### Parallel Team Strategy
- 后端：US2 → US5 → US3 → US6（服务/端点/回调）
- mp 前端：US2 → US1 → US3 → US4（页面/支付）
- admin 前端：US5 → US6（视图/筛选/退款）
- 三条线在 Phase 2 完成后并行推进

---

## Notes
- `[P]` = 不同文件、无未完成依赖。
- `[USx]` 映射 spec.md 用户故事，便于追溯与独立验收。
- 每个故事完成后提交（commit）；遇 checkpoint 先独立验证再继续。
- 避免：模糊任务、同文件冲突、破坏故事独立性的跨故事依赖。
- 微信支付/退款回调须公网 HTTPS；本地用内网穿透或 mock（见 quickstart.md）。
