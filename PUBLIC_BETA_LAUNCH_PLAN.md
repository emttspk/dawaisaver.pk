# Public Beta Launch Plan

## Deployment Status

| Component | Status | URL |
|-----------|--------|-----|
| Backend API | ✅ Deployed | Railway (service: dawaisaver.pk) |
| Frontend PWA | ⚠️ Foundation only | Not yet deployed |
| Admin Panel | ⚠️ Foundation only | Not yet deployed |

## Backend Access

The backend API is deployed on Railway:
- Project: `dawaisaver.pk`
- Service: `dawaisaver.pk`
- Health: `/health/application`
- Database: `/health/database`

**Note:** Frontend requires `VITE_API_URL` to point to the Railway backend.

## Frontend Deployment Required

1. Build frontend: `npm run build` in `apps/web/`
2. Deploy to Cloudflare Pages
3. Configure `VITE_API_URL` environment variable

## Public Beta Checklist

- [x] Backend deployed
- [x] Database healthy
- [x] R2 configured
- [x] OCR upload wired
- [x] Rate limiting active
- [x] Tests pass (36/36)
- [ ] Frontend deployed
- [ ] Admin deployed

## Feedback Collection

Use the provided feedback templates:
- `BUG_REPORT_TEMPLATE.md`
- `FEATURE_REQUEST_TEMPLATE.md`
- `USER_FEEDBACK_WORKFLOW.md`