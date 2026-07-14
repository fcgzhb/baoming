# ===== NestJS backend =====
# Build context = repo root (so workspace + packages/shared resolve).
# Build: docker build -f apps/server/Dockerfile -t baoming-server .

# ---- builder ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/
RUN pnpm install --frozen-lockfile
# shared must build first (server imports it as a workspace dep)
RUN pnpm --filter @baoming/shared build
RUN pnpm --filter @baoming/server build
# Bundle @baoming/server + production deps (incl. @baoming/shared dist) into /deploy
RUN pnpm deploy --filter=@baoming/server --prod /deploy

# ---- runner ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# openssl kept for any native-module fallbacks; slim image has none otherwise
COPY --from=builder /deploy/package.json ./package.json
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /deploy/dist ./dist
# Runtime config comes from env (apps/server/.env or docker-compose env_file)
EXPOSE 3000
CMD ["node", "dist/main.js"]
