FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS dev-deps
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "node ./node_modules/.bin/knex migrate:latest && node --watch src/index.ts"]

FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono
COPY --from=deps --chown=hono:nodejs /app/node_modules ./node_modules
COPY --from=dev-deps --chown=hono:nodejs /app/src ./src
COPY --from=dev-deps --chown=hono:nodejs /app/package.json ./
USER hono
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node", "src/index.ts"]
