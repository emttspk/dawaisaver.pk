# Next Actions

## Current Task

Cloudflare Pages Deployment and Public Beta Release.

## Completed

- Customer web UI completed for public beta.
- Admin/reviewer UI completed for public beta.
- Core customer API flows wired: registration, login, search, autocomplete, alternatives, prescription text, OCR upload/review, cost savings report, dashboard stats.
- Core admin API flows wired: login, OCR queue, prescription review, discovery review, price anomalies, source health, system health.
- Web build passes.
- Admin build passes.
- Backend build passes.

## Next

- Configure Cloudflare Pages project for `apps/web`.
- Set `VITE_API_URL=<Railway API URL including /api>`.
- Deploy customer frontend.
- Deploy `apps/admin` as a separate Pages project if the beta admin console should be public-web accessible.
- Run public beta smoke tests against deployed URLs.
