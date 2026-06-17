# P24 Frontend and Admin UI Report

## Date

2026-06-17

## Summary

P24 completed the public beta customer UI and admin UI across `apps/web` and `apps/admin`.

## Customer UI

- Implemented all required customer pages.
- Connected auth, search, autocomplete, alternatives, prescription text, OCR upload/process, OCR review, cost estimate, stats, and local history flows.
- Added loading, error, and empty states.
- Added JWT-backed login/logout and protected dashboard/profile routes.
- Added mobile-first layout and PWA install prompt handling.
- Added safety wording: equivalent options with same active ingredient, strength, and dosage form.
- Added high-risk medicine warning display on prescription savings reports.

## Admin UI

- Implemented all required admin pages.
- Connected admin/reviewer login, OCR jobs, prescription reviews, discovery candidates/review, price anomalies, source health, and root health endpoints.
- Added searchable/filterable review queues.
- Added confidence scores, evidence/source display, health states, and audit notes.
- Added medicine match review tool using `/api/matching/evaluate`.

## Backend Compatibility

- Added `id` to `DiscoveryCandidateDto` and discovery candidate responses so the existing review endpoint can act on selected UI rows.

## Validation

- `apps/web`: build pass.
- `apps/admin`: build pass.
- API: build pass.
- Root tests: pass, 25 suites and 36 tests. Existing Jest worker forced-exit warning appears after success.

## Deployment Notes

- Customer Cloudflare Pages app should build from `apps/web` and publish `apps/web/dist`.
- Admin Cloudflare Pages app can build from `apps/admin` and publish `apps/admin/dist` if separate deployment is desired.
- Set `VITE_API_URL=<Railway API URL including /api>` for both frontends.

## Known Limitations

- OCR queue approve/reject and price anomaly approve/reject are UI-ready but require backend review endpoints.
- User activity dashboard needs a dedicated admin activity endpoint for production analytics.
- Authenticated dashboard stats depend on backend prescription records being associated with `userId`.
