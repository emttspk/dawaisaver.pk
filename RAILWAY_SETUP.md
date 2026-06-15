# Railway Setup

## Railway CLI Commands

```bash
railway login
railway link
railway variables
railway up
railway status
```

## Required Environment Variables

- `DATABASE_URL`
- `NODE_ENV`
- `APP_HOST`
- `APP_PORT`
- `CORS_ORIGINS`
- `RATE_LIMIT_TTL_SECONDS`
- `RATE_LIMIT_MAX_REQUESTS`
- `LOG_LEVEL`
- `ENABLE_DB_MIGRATIONS`

## Optional Environment Variables

- `GOOGLE_CLOUD_VISION_API_KEY` - Google Cloud Vision API key for OCR
- `UPLOAD_DIR` - Directory for uploaded files

## Deployment Steps

1. Install the Railway CLI and authenticate.
2. Link the repository to the Railway project.
3. Set the environment variables for the target environment.
4. Confirm the database service is provisioned and `DATABASE_URL` is present.
5. Deploy the backend service with `railway up`.
6. Verify `GET /health` returns a healthy response after deployment.
