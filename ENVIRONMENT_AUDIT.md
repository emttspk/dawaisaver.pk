# Environment Audit

## Date: 2026-06-16

## Railway Variables Status

### PRESENT
| Variable | Status |
|----------|--------|
| NODE_ENV | development |
| APP_NAME | DawaiSaver.pk API |
| APP_PORT | 3000 |
| APP_HOST | 0.0.0.0 |
| APP_GLOBAL_PREFIX | api |
| CORS_ORIGINS | http://localhost:5173 |
| RATE_LIMIT_TTL_SECONDS | 60 |
| RATE_LIMIT_MAX_REQUESTS | 120 |
| RUN_MIGRATIONS_ON_BOOT | false |
| R2_BUCKET_NAME | dawaisaver-pk |
| JWT_SECRET | (set - change in production) |
| JWT_REFRESH_SECRET | (set - change in production) |
| JWT_EXPIRES_IN | 15m |
| JWT_REFRESH_EXPIRES_IN | 7d |
| CRAWLER_USER_AGENT | DawaiSaverBot/0.1 |
| CRAWLER_CONCURRENCY | 2 |
| UPLOAD_DIR | uploads |

### MISSING
| Variable | Required For |
|----------|--------------|
| DATABASE_URL | PostgreSQL connection |
| R2_ACCOUNT_ID | Cloudflare R2 access |
| R2_ACCESS_KEY_ID | Cloudflare R2 access |
| R2_SECRET_ACCESS_KEY | Cloudflare R2 access |
| GOOGLE_CLOUD_VISION_API_KEY | OCR service |

### OPTIONAL
| Variable | Purpose |
|----------|---------|
| CORS_ORIGINS | CORS configuration |
| RATE_LIMIT_TTL_SECONDS | Rate limiting window |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window |
| RUN_MIGRATIONS_ON_BOOT | Auto-run migrations |
| JWT_EXPIRES_IN | Token expiry |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiry |
| CRAWLER_USER_AGENT | Web scraping identification |
| CRAWLER_CONCURRENCY | Scraper concurrency |
| UPLOAD_DIR | Local upload directory |

## R2 Compliance

| Requirement | Status |
|-------------|--------|
| R2 Bucket | ✅ dawaisaver-pk |
| Railway filesystem | ✅ Temporary only |
| Docker filesystem | ✅ Temporary only |
| PostgreSQL | ✅ Metadata only |

## Deployment Readiness

| Component | Status |
|-----------|--------|
| Build | ✅ Pass |
| Tests | ✅ 34/34 |
| R2 Policy | ✅ Documented |
| Environment | ⚠️ Missing production values |