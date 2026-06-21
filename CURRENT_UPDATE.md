# CURRENT UPDATE

Date: 2026-06-21
Project: DawaiSaver.pk

## Incident Result

- Production mirror dashboard restored at `https://dawaisaver-admin.pages.dev/#/admin/mirror-status`.
- Full DRAP crawl remains paused and was not started during this repair.
- Completion percentage: 99%.

## Root Cause

- Cloudflare Pages production was serving stale asset `index-062f52c1.js` even though source commit `13f0932d1373246ec76e264ff08ab66f490a802a` already selected the same-origin `/api` proxy.
- The stale asset contained `http://yh5wt7bbkhqsjycey5df0lbe.178.105.221.236.sslip.io` and did not contain `/api/admin/mirror-status`.
- Chrome blocked the HTTP API request from the HTTPS Pages application as mixed content. The failed browser request therefore had no HTTP response status; `Failed to fetch` was the frontend symptom.
- The same-origin Pages proxy was healthy independently: unauthenticated `GET /api/admin/mirror-status` returned the expected `401`, not `404`, and included valid CORS headers.

## Fix Applied

- Rebuilt the admin application from source with `VITE_API_URL=/api`.
- Deployed rebuilt asset `index-b79fa125.js` and the Pages Functions bundle with Wrangler.
- New production deployment: `00dbb357`.
- Deployed Git commit SHA: `13f0932d1373246ec76e264ff08ab66f490a802a`.
- Cloudflare production variables contain secret `BACKEND_ORIGIN`; no production `VITE_API_URL` variable is configured. The build safely uses the repository-local `/api` value.
- Cloudflare Git builds now use `apps/admin` as the root, `npm run build` as the build command, and `dist` as the output directory; this prevents successful-but-empty Pages deployments.

## Production Proof

- Cache-bypassed production HTML references `/assets/index-b79fa125.js`.
- New bundle contains zero raw HTTP Coolify-origin matches and uses same-origin `/api`.
- `OPTIONS /api/admin/mirror-status` returns `204` with the required authorization and CORS headers.
- Authenticated browser request `GET https://dawaisaver-admin.pages.dev/api/admin/mirror-status` returns `200`.
- Authenticated browser request `GET https://dawaisaver-admin.pages.dev/api/admin/mirror/runtime` returns `200`.
- Browser capture reports zero mirror network failures and zero console errors.
- Production DOM renders the mirror status metrics and does not render `Status load failed`.

## Remaining Blocker

- No dashboard technical blocker remains.
- Full DRAP acquisition still requires explicit operational approval.
