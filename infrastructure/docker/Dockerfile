FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY services/api/package.json services/api/package.json
COPY services/scoring/package.json services/scoring/package.json
COPY services/worker/package.json services/worker/package.json
COPY packages/ packages/
RUN npm ci

FROM deps AS builder
COPY turbo.json tsconfig.base.json eslint.config.mjs .prettierrc.json .prettierignore ./
COPY apps/ apps/
COPY services/ services/
COPY packages/ packages/
RUN npm run build

FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/packages packages/
COPY --from=builder /app/apps apps/
COPY --from=builder /app/services services/
COPY --from=builder /app/apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static

ENV NODE_ENV=production
