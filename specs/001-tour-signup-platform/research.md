# Phase 0 — Research & Decisions

**Feature**: 旅游游学项目报名小程序平台 · **Branch**: `001-tour-signup-platform` · **Date**: 2026-07-13

> 记录每个关键技术决策的 **Decision / Rationale / Alternatives**。用户已直接确认的约束（Node.js 后端、MySQL、前后端同仓、NestJS、TypeORM、uni-app、Vue3+Element Plus）标注为「用户确认」，其余为基于最佳实践的推荐，可在 `/speckit.tasks` 前调整。

---

## D1. 工程结构：pnpm workspaces monorepo

- **Decision**: 根目录 pnpm workspaces，`apps/{server,admin,mp}` + `packages/shared`。
- **Rationale**: 用户明确要求前后端同目录；三端 + 共享类型需统一版本与本地链接；pnpm workspaces 零额外运行时、磁盘占用小、对 NestJS/Vite/uni-app 工具链兼容好。
- **Alternatives**:
  - Turborepo：增量构建/远程缓存强，但当前规模（3 app）收益有限，增加心智负担。
  - Nx：插件丰富但配置重，过早期引入过度工程。
  - npm/yarn workspaces：可用，但 pnpm 的严格依赖隔离与硬链接更省空间、更少幽灵依赖。

## D2. 后端框架：NestJS + TypeScript（用户确认）

- **Decision**: NestJS 10 + TypeScript。
- **Rationale**: 订单/支付/退款/名额并发领域逻辑复杂，NestJS 的模块化、DI、装饰器（`@Controller`/`@Injectable`）、统一异常过滤与守卫（`JwtAuthGuard`）显著提升可维护性；与 TypeORM、class-validator 开箱集成；TS 类型贯穿三端（经 `packages/shared`）。
- **Alternatives**:
  - Express + TS：最轻，但需自建模块/校验/DI 体系，长期维护成本高。
  - Koa + TS：中间件优雅，但生态/脚手架不及 NestJS。
  - Midway：本土化好、NestJS 风格；若团队更熟悉可替换（接口契约不变）。

## D3. ORM：TypeORM + mysql2（用户确认）

- **Decision**: TypeORM（实体 + 迁移 + QueryRunner 事务）。
- **Rationale**: 与 NestJS 原生集成（`@nestjs/typeorm`）；装饰器实体直观；`QueryRunner` 支持行锁事务，适合名额原子扣减；迁移工具成熟。
- **Alternatives**:
  - Prisma：类型与 DX 更佳，但部分复杂事务/行锁需退回 raw；用户选 TypeORM。
  - Sequelize：API 较旧、TS 体验弱。
  - mysql2 裸 SQL：掌控最大但迁移/类型/防注入需自建，工作量大。

## D4. 小程序端：uni-app（Vue 3）（用户确认）

- **Decision**: uni-app（编译目标：微信小程序）。
- **Rationale**: 与后台 Vue 3 技术栈一致，团队心智统一；可复用 Vue 生态（Pinia、组合式 API）。微信支付/登录经 `uni.requestPayment` / `uni.login({provider:'weixin'})` 调用，编译后映射到原生 API。
- **注意**: 需在 `manifest.json` 配微信 AppID；订阅消息/手机号授权使用原生 `button open-type` 组件。
- **Alternatives**:
  - 原生小程序：微信能力兼容最直接、无抽象损耗；若后期出现 uni-app 适配问题，可降级（接口契约不变）。
  - Taro：React 风格跨端；与后台 Vue 栈不统一。

## D5. 后台管理端：Vue 3 + Element Plus + Vite（用户确认）

- **Decision**: Vue 3 + Element Plus + Vite + Pinia + Vue Router。
- **Rationale**: 国内后台事实标准；表单/表格/分页/筛选/对话框组件齐全，订单与用户管理开箱即用；Vite 启动快；Pinia 管理登录态。
- **Alternatives**:
  - React + Ant Design Pro：企业级生态强，但与 Vue 栈分裂。
  - Vue 3 + Ant Design Vue：可选，组件同样丰富。

## D6. 认证与会话：JWT（HS256），用户/管理员双体系

- **Decision**: 后端签发 JWT；用户端（小程序）与后台各自一套守卫与 token。
  - 小程序用户：`code2session` → openid → 查/建 `users` → 签发 user JWT（含 `userId`、`role='user'`）。
  - 管理员：账号密码（bcrypt）→ 签发 admin JWT（含 `adminId`、`role='admin'`）。
  - 手机号：`<button open-type="getPhoneNumber">` 取 code → 后端 `phonenumber/getPhoneNumber` 换号 → 写回 `users.phone`。
- **Rationale**: 无状态、易水平扩展；双守卫（`@UseGuards(JwtAuthGuard)` / 管理员角色守卫）边界清晰。
- **Alternatives**: session+cookie（小程序场景 JWT 更顺手）；双 token/refresh（v1 可选，过期重登即可，后续迭代）。
- **安全**: 密钥走环境变量；JWT 过期时间（如 7 天）；`role`/`userId` 服务端再校验，不信任前端权限。

## D7. 微信支付：wechatpay-node-v3（V3 Base API）

- **Decision**: 统一下单走 V3 `pay/transactions/jsapi`，返回小程序支付参数；`wechatpay-node-v3` SDK 签名/验签。
- **流程**:
  1. 用户下单（创建 `orders`，状态 `pending`，**不扣名额**）。
  2. 后端调 JSAPI 下单，返回 `prepay_id` + 签名支付参数给小程序。
  3. 小程序 `uni.requestPayment` 拉起支付。
  4. 微信异步 `notify` 到后端 → **验签 + 校验金额** → 原子扣减名额 + 订单置 `confirmed`（幂等：已确认则直接返回 SUCCESS）。
- **Alternatives**: 自实现 V3 签名（易错，不推荐）；V2 API（已逐步淘汰）。
- **掉单兜底**: 提供定时任务/管理端「查单」按钮，调 V3 查询接口按微信实际状态补单或关单（FR-013）。

## D8. 微信退款：全额退款 + refund-notify

- **Decision**: 管理员发起全额退款 → 后端调 V3 `refund/domestic/refunds`（金额=订单实付）→ 微信异步 `refund-notify` → 验签 → 订单置 `refunded` + 释放名额（`registered_count - 1`，幂等）。
- **Rationale**: v1 仅全额退款（spec 已确认），状态机与对账简单；部分退款后续迭代。
- **失败处理**: 退款接口返回失败/处理中时，订单状态反映为「退款处理中/失败」，允许管理员重试；以 `refund-notify` 为准更新最终状态（FR-106）。

## D9. 名额并发控制：乐观原子扣减（spec 已确认策略 A）

- **Decision**: 提交订单时校验剩余名额（满则拒绝，FR-005/FR-010）；支付成功回调内执行：
  ```sql
  UPDATE projects
  SET registered_count = registered_count + 1
  WHERE id = ? AND registered_count < total_quota;
  -- 受影响行数 = 0 → 名额已被抢完 → 立即原路全额退款并标记订单
  ```
- **Rationale**: 单条 UPDATE 带条件即原子，无需显式行锁，高并发下吞吐优于 `SELECT ... FOR UPDATE`；超卖率=0；失败者自动退款。
- **待支付订单不锁定名额**（spec 已确认），故无需超时释放定时任务。
- **Alternatives**:
  - 待支付即锁定名额 + 超时释放（更友好但需定时任务与占位逻辑，v1 不采用）。
  - Redis 分布式锁（当前 MySQL 单库无必要，增加运维复杂度）。

## D10. 唯一性约束（同项目同证件号仅一条有效订单）

- **背景**: MySQL 不支持 PostgreSQL 式部分唯一索引。
- **Decision**: 双重保障——
  1. **应用层**：下单事务内 `SELECT` 该 project + id_card 是否存在 `pending/confirmed` 订单，有则拒绝（FR-015）。
  2. **DB 兜底**：在 `orders` 上加**生成列** `active_key`（状态为 pending/confirmed 时 = `project_id:id_card`，否则 NULL），对其建唯一索引。MySQL 唯一索引忽略 NULL，故历史取消/退款订单不冲突。
- **Rationale**: 生成列方案是 MySQL 下实现「条件唯一」的标准做法；应用层检查提供友好错误，DB 兜底防并发竞态。
- **Alternatives**: 仅应用层检查（并发下仍有竞态窗口，不安全）；`status_active` 冗余列手动维护（易脏数据）。

## D11. 支付/退款回调幂等与安全

- **Decision**:
  - 回调路由公网可达但**仅信任验签通过**的报文（SDK 验签 + 解密）。
  - 处理前以 `orders.transaction_id` + 状态做幂等：已 `confirmed` 的支付回调直接返回 SUCCESS；已 `refunded` 的退款回调直接返回 SUCCESS。
  - 金额以订单锁定价为准，回调金额不符则告警不确认。
- **Rationale**: 防重复回调、防伪造；保证资金与状态一致（SC-005）。

## D12. 金额与时间

- **Decision**: 金额 DB 用 `DECIMAL(10,2)`（元）；与微信交互转为**分**（整数）传参，避免浮点误差。时间统一 `DATETIME(3)` 存 UTC，输出按需格式化。
- **Rationale**: 微信支付金额单位为分；DECIMAL 保证对账精度。

## D13. 文件/图片存储：腾讯云 COS（默认，待确认账号）

- **Decision**: 项目封面、图文介绍图片上传至对象存储，DB 只存 URL。默认推荐腾讯云 COS（与微信生态同region免流转费）。
- **待确认**: 用户是否已有 COS/OSS 账号与 Bucket；未确认前 quickstart 以本地 `/uploads` 临时承载。
- **Alternatives**: 阿里云 OSS、七牛云、自建 MinIO。

## D14. 校验、配置与测试

- **校验**: `class-validator` + `class-transformer`（NestJS `ValidationPipe`），DTO 与 `packages/shared` 共享；证件号格式按类型（身份证/护照/户口本）正则。
- **配置/密钥**: `@nestjs/config` 读 `.env`；微信商户密钥/证书、JWT 密钥、DB 口令均走环境变量，**严禁入库/入仓**；`.env.example` 仅放键名。
- **测试**: Jest（后端 unit/integration + 回调验签 + 名额并发集成测试）；Vitest（admin/mp 关键工具）；契约测试对照 `contracts/`；关键前端流程手动 + 微信开发者工具。

## D15. 管理员初始化与可观测性

- **Decision**: 首个管理员由启动种子脚本 `pnpm --filter server seed:admin` 注入（账号从 env 读取，密码 bcrypt）；其后由已有管理员在后台增删。操作日志写入 `audit_logs`（FR-108）。
- **可观测**: 结构化日志（请求/回调/退款/名额变更/异常）；v1 不强制接入 APM，留接口。

---

## 仍需用户确认（非阻塞，可在 tasks 阶段定）

- [ ] 对象存储：腾讯云 COS / 阿里 OSS / 自建 MinIO？（默认 COS）
- [ ] 部署目标：单机 Docker / 云服务器 / Serverless？（影响 quickstart 与运维）
- [ ] 是否需要独立的 HTTPS 域名与微信支付回调域名（小程序 request 合法域名 + 支付回调需 HTTPS 公网）。

> 以上不阻塞 `/speckit.tasks`；如未答复，将按「COS + 单机 Docker + 需 HTTPS 公网回调域名」默认推进并在 tasks 中标注假设。
