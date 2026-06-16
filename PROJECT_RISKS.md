# Project Risks

## High Risks

- Medicine equivalence can be unsafe if composition equivalence is confused with clinical substitution.
- External data sources may be incomplete, inconsistent, stale, or legally restricted.
- User prescriptions and bills contain sensitive personal data.
- Price data can become stale quickly.
- Prescription parsing errors can produce unsafe matches if not reviewed.

## Medium Risks

- Fuzzy matching may merge distinct products incorrectly.
- Pharmacy and manufacturer names may have many aliases.
- DRAP and pharmacy source formats may change without notice.
- Low-quality OCR can create false medicine matches.

## Controls

- Store source attribution on all records.
- Preserve historical observations.
- Use confidence scores and admin review.
- Keep medical disclaimers and professional-confirmation language in user-facing flows.
- Create audit logs for ingestion, review, and mutation actions.
- Flag high-risk medicines such as insulin, blood thinners, anticonvulsants, steroids, and psychiatric medicines for manual review.
- OCR confidence threshold of 0.7 triggers review requirement.

## Current Residual Risk

The database foundation is documented and modeled, but it has not been applied to a live PostgreSQL database yet. OCR providers are stub implementations pending API key configuration for production use. DATABASE_URL and migrations need to be configured before deployment.
# P10 Railway Link Risk - 2026-06-16

Risk: Railway CLI status resolves to the wrong project, `AI Photo Studio WhatsApp` (`ad62f340-fcfd-4989-b5bb-18753b28d8c8`), instead of `dawaisaver.pk` (`e38bb3da-7ab5-4654-b504-101e74c92d5b`).

Impact: Any variable, migration, or deployment command could target the wrong Railway project until link validation succeeds.

Mitigation: Keep deployment work stopped. Repair auth, relink with the explicit DawaiSaver project id, and require all validation commands to report the expected project id before continuing.

# P10 Production Deployment Setup Risks - 2026-06-16

Risk: Railway relink to `dawaisaver.pk` failed with `Unauthorized`, so production variables and deployments cannot be safely audited.

Impact: Running `railway variables`, `npx prisma migrate deploy`, or `railway up` could target the wrong project if attempted without identity repair.

Mitigation: Require `railway status --json` to return project id `e38bb3da-7ab5-4654-b504-101e74c92d5b` before any production mutation.

Risk: Wrangler is unauthenticated in this workspace.

Impact: R2 bucket access, upload access, public URL verification, and Cloudflare Pages deployment cannot be completed.

Mitigation: Provide `CLOUDFLARE_API_TOKEN` or complete `wrangler login`, then rerun R2 and Pages checks.
