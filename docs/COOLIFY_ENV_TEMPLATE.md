# Coolify Environment Template

## API Service

```env
NODE_ENV=production
APP_PORT=3000
APP_HOST=0.0.0.0
APP_GLOBAL_PREFIX=api
CORS_ORIGINS=https://admin.example.com,https://api.example.com
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/dawaisaver?schema=public
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<cloudflare-r2-access-key>
R2_SECRET_ACCESS_KEY=<cloudflare-r2-secret-key>
R2_BUCKET_NAME=dawaisaver-pk
R2_PUBLIC_BASE_URL=https://<r2-public-domain>
MIRROR_ENABLED=false
MIRROR_MIGRATION_MODE=true
RUN_MIGRATIONS_ON_BOOT=false
INTERNAL_API_KEY=<optional-internal-key>
GOOGLE_CLOUD_VISION_API_KEY=<optional-google-vision-key>
UPLOAD_DIR=uploads
```

## Admin Service

```env
VITE_API_URL=https://api.example.com/api
```

## Notes

- `DATABASE_URL` must use the PostgreSQL connection string for the restored PostgreSQL 18 database.
- `R2_*` values are required for any upload or OCR storage path that touches Cloudflare R2.
- `MIRROR_ENABLED=false` and `MIRROR_MIGRATION_MODE=true` must remain set until migration verification is complete.
- `VITE_API_URL` is only required when the admin bundle cannot share the same origin as the API.
