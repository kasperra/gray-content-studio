# Production image for the VPS (Coolify). Next.js standalone output.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
# NEXT_PUBLIC_SITE_URL is baked in at build time. Nothing else is needed to
# build: the database and file storage are only used at runtime.
ARG NEXT_PUBLIC_SITE_URL=https://www.graycontentstudio.co
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN apk add --no-cache curl && addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
# Migrations run at start (see CMD). The app bundles its own copy of the
# postgres driver; the migrate script needs the package itself.
COPY --from=build --chown=app:app /app/db ./db
COPY --from=build --chown=app:app /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=deps --chown=app:app /app/node_modules/postgres ./node_modules/postgres
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD curl -fsS http://localhost:3000/ >/dev/null || exit 1
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node server.js"]
