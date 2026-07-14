# ===== Vue3 admin SPA (built, served by nginx) =====
# Build context = repo root.
# Build: docker build -f apps/admin/Dockerfile -t baoming-admin .

# ---- builder ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @baoming/shared build
RUN pnpm --filter @baoming/admin build

# ---- runner: nginx serves the SPA, proxies /api to the backend container ----
FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
