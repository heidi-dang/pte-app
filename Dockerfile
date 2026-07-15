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
COPY packages/domain/package.json packages/domain/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/provenance/package.json packages/provenance/package.json
COPY packages/schemas/package.json packages/schemas/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN npm ci --ignore-scripts

FROM base AS build
COPY . .
RUN mkdir -p apps/web/public
RUN npm run build

FROM base AS deps-prod
RUN npm ci --ignore-scripts --omit=dev && npm rebuild bcrypt && npm cache clean --force

FROM node:24-alpine AS runtime-base
WORKDIR /app
COPY --from=deps-prod /app/node_modules /app/node_modules
COPY infrastructure/scripts/healthcheck.mjs /app/healthcheck.mjs
COPY package.json /app/package.json

FROM runtime-base AS packages-layer
COPY --from=build /app/packages/contracts/dist /app/packages/contracts/dist
COPY --from=build /app/packages/database/dist /app/packages/database/dist
COPY --from=build /app/packages/database/src/migrations /app/packages/database/dist/migrations
COPY --from=build /app/packages/design-system/dist /app/packages/design-system/dist
COPY --from=build /app/packages/domain/dist /app/packages/domain/dist
COPY --from=build /app/packages/provenance/dist /app/packages/provenance/dist
COPY --from=build /app/packages/schemas/dist /app/packages/schemas/dist
COPY --from=build /app/packages/types/dist /app/packages/types/dist
COPY packages/contracts/package.json /app/packages/contracts/package.json
COPY packages/database/package.json /app/packages/database/package.json
COPY packages/domain/package.json /app/packages/domain/package.json
COPY packages/provenance/package.json /app/packages/provenance/package.json
COPY packages/schemas/package.json /app/packages/schemas/package.json
COPY packages/types/package.json /app/packages/types/package.json

FROM packages-layer AS web
COPY --from=build /app/apps/web/.next/standalone /app
COPY --from=build /app/apps/web/.next/static /app/apps/web/.next/static
COPY --from=build /app/apps/web/public /app/apps/web/public
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=30s \
  CMD node /app/healthcheck.mjs http://127.0.0.1:3000/ 5000 200 3 1000
CMD ["node", "apps/web/server.js"]

FROM packages-layer AS api
COPY --from=build /app/services/api/dist /app/services/api/dist
COPY services/api/package.json /app/services/api/package.json
ENV NODE_ENV=production
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=30s \
  CMD node /app/healthcheck.mjs http://127.0.0.1:4000/health/live 5000 200 3 1000
CMD ["node", "services/api/dist/main.js"]

FROM packages-layer AS scoring
COPY --from=build /app/services/scoring/dist /app/services/scoring/dist
COPY services/scoring/package.json /app/services/scoring/package.json
ENV NODE_ENV=production
EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=15s \
  CMD node /app/healthcheck.mjs http://127.0.0.1:5000/health/live 5000 200 3 1000
CMD ["node", "services/scoring/dist/main.js"]

FROM packages-layer AS worker
COPY --from=build /app/services/worker/dist /app/services/worker/dist
COPY services/worker/package.json /app/services/worker/package.json
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD node /app/services/worker/dist/check.js
CMD ["node", "services/worker/dist/main.js"]
