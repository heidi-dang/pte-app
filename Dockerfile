FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare npm@11.6.0 --activate
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY services/api/package.json services/api/package.json
COPY services/scoring/package.json services/scoring/package.json
COPY services/worker/package.json services/worker/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/design-system/package.json packages/design-system/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/provenance/package.json packages/provenance/package.json
COPY packages/schemas/package.json packages/schemas/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN npm ci --ignore-scripts

FROM base AS source
COPY . .
RUN npm run build

FROM source AS web-prod
WORKDIR /app/apps/web
RUN cp -r .next/standalone /app/web-app && \
    cp -r .next/static /app/web-app/apps/web/.next/static && \
    cp -r public /app/web-app/apps/web/ 2>/dev/null || true

FROM node:24-alpine AS web
RUN corepack enable && corepack prepare npm@11.6.0 --activate
COPY --from=web-prod /app/web-app /app
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

FROM node:24-alpine AS api
RUN corepack enable && corepack prepare npm@11.6.0 --activate
WORKDIR /app
COPY --from=source /app /app
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "--import", "tsx", "services/api/src/main.ts"]

FROM node:24-alpine AS scoring
RUN corepack enable && corepack prepare npm@11.6.0 --activate
WORKDIR /app
COPY --from=source /app /app
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "--import", "tsx", "services/scoring/src/main.ts"]

FROM node:24-alpine AS worker
RUN corepack enable && corepack prepare npm@11.6.0 --activate
WORKDIR /app
COPY --from=source /app /app
ENV NODE_ENV=production
CMD ["node", "--import", "tsx", "services/worker/src/main.ts"]
