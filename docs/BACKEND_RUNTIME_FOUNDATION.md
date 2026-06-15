# Backend Runtime Foundation

## Purpose

The Backend Runtime Foundation creates an executable NestJS application shell for DawaiSaver.pk.

## Runtime Files

- `package.json`
- `tsconfig.json`
- `nest-cli.json`
- `eslint.config.mjs`
- `.prettierrc`
- `.env.example`
- `docker-compose.yml`
- `Dockerfile`
- `railway.json`

## Application Structure

- `src/main.ts`
- `src/app.module.ts`
- `src/runtime-feature.module.ts`
- `src/config/`
- `src/database/`
- `src/common/`
- `src/health/`

## Health Endpoints

```text
GET /health
GET /health/database
GET /health/application
```

## Registered Feature Modules

The runtime registers provider bridges for:

- DRAP Import Engine
- Source Framework
- Price Intelligence Engine
- Medicine Matching Engine
- Search API Foundation
- Product Discovery Engine

## Configuration

Configuration is loaded through `@nestjs/config` and validated at startup.

Required:

- `DATABASE_URL`

Important optional values:

- `APP_PORT`
- `APP_HOST`
- `APP_GLOBAL_PREFIX`
- `CORS_ORIGINS`
- `RATE_LIMIT_TTL_SECONDS`
- `RATE_LIMIT_MAX_REQUESTS`
- Cloudflare R2 placeholders
- crawler settings

## Database Bootstrap

Prisma client is wired through `PrismaService`.

Commands:

```text
npm run prisma:generate
npm run prisma:migrate
npm run db:bootstrap
```

## Railway Deployment

Railway uses `railway.json` and the Dockerfile.

Required Railway variables:

- `DATABASE_URL`
- `NODE_ENV=production`
- `APP_PORT`
- `APP_HOST=0.0.0.0`
- `CORS_ORIGINS`

Healthcheck path:

```text
/health
```

## Docker Development

Start local dependencies:

```text
docker compose up -d postgres redis
```

Then run:

```text
npm install
npm run prisma:generate
npm run build
npm run start:dev
```

## Recovery Procedure

1. Read `AI_IMPLEMENTATION_INDEX.md`, `PROJECT_STATE.md`, and `PROJECT_MEMORY.md`.
2. Copy `.env.example` to `.env` and fill `DATABASE_URL`.
3. Run `npm install`.
4. Run `npm run prisma:generate`.
5. Run `npm run build`.
6. Start local database through `docker-compose.yml`.
7. Run `npm run start:dev`.

## Next Task

API Controller Layer.

