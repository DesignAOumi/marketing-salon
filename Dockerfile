# syntax=docker/dockerfile:1
# ──────────────────────────────────────────────────────────────
#  美容サロン顧客管理ツール — 本番イメージ（Next.js + Prisma + SQLite）
#  multi-stage:  deps → builder → runner
# ──────────────────────────────────────────────────────────────

# ---- deps: 全依存をインストール（ビルド用）----
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# ---- builder: prisma generate + next build ----
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- runner: 本番依存のみ + ビルド成果物 ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN apk add --no-cache libc6-compat

# 本番依存のみ（prisma CLI と @prisma/client は dependencies に含む＝マイグレーション実行可）
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Prisma スキーマ/マイグレーション/シード（起動時に migrate deploy + seed を実行）
COPY prisma ./prisma
RUN npx prisma generate

# アプリ本体・設定・参照データ
COPY --from=builder /app/.next ./.next
COPY public ./public
COPY next.config.mjs ./next.config.mjs
COPY data ./data
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
  && mkdir -p /app/var \
  && addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs \
  && chown -R nextjs:nodejs /app
# 固定 UID/GID 1001（named volume は所有権を継承。バインドマウント時は host 側を 1001 に揃える）
USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
