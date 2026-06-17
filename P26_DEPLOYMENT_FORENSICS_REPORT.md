# P26 Deployment Forensics Report

## Date

2026-06-17

## Objective

Determine why the Cloudflare Pages production URL still showed prototype-quality UI after `200dfbb feat: premium ui transformation`, then rebuild and redeploy if stale.

## Verification Summary

| Check | Result |
| --- | --- |
| Latest commit exists locally | Pass, `200dfbb9f1acb195ad9841cccb5dba51a92f9af4` |
| Latest commit exists on GitHub main | Pass, `origin/main` matched local `HEAD` |
| Cloudflare Pages deployment status checked | Pass |
| Pages project build model checked | Pass, direct upload/no Git provider |
| Build output directory checked | Pass, `apps/web/dist` and `apps/admin/dist` |
| Production deployment source checked | Finding, production was stale before redeploy |
| Deployed bundle compared with local build | Pending final post-commit redeploy verification |

## Root Cause

The production Pages project was stale because `dawaisaver-web` is a direct-upload Cloudflare Pages project and does not auto-build from GitHub. GitHub `main` had the premium UI commit, but the Pages production deployment was still serving an older deployment source.

A second build issue made the first manual redeploy appear prototype-like: app-level PostCSS configuration was missing, so Tailwind directives were emitted into the CSS bundle instead of being compiled into real styles.

## Fix Applied

- Added PostCSS config to `apps/web`.
- Added PostCSS config to `apps/admin`.
- Rebuilt web, admin, and backend.
- Prepared the customer and admin bundles for Wrangler Pages deployment.

## Build Evidence

| Artifact | SHA256 |
| --- | --- |
| `apps/web/dist/assets/index-7b392a13.css` | `7B392A13FF31BA1D766EB13C0AE11A8855D5BE2E010B10E64284FEC7A5D06265` |
| `apps/web/dist/assets/index-cc477728.js` | `16D164E1A79063AF4A3CB8359865AB1CFE3A2DF5DB003413278C835A683ABA8D` |
| `apps/admin/dist/assets/index-f3a6b999.css` | `F3A6B99924E7AA85263A096A178A69BDDE14A67217EDA2F28C06E023D7A61CAB` |
| `apps/admin/dist/assets/index-a1518c71.js` | `0406B1C79421E4606D4ACE565A1A5948DF28A0A2B76660C903CAF25EEB386CCF` |

## Visual Evidence

- Screenshot path: `docs/screenshots/p26-dawaisaver-web-live.png`

## Constraints

- No backend logic changes.
- No API contract changes.
- No database changes.
- No authentication changes.
- No business logic changes.
