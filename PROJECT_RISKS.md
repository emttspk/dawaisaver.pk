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

The live production database is attached and healthy, and the R2 bucket-level smoke test passed. The remaining runtime risk is the manual Cloudflare-sourced R2 secret pair and public base URL, which must be attached in Railway before live production upload UAT can be repeated.
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

# Infrastructure Completion Risks - 2026-06-16

Risk: `DATABASE_URL` is missing and no Railway Postgres resource is visible.

Impact: Migrations, seed data, database-backed search, auth persistence, prescriptions, reviews, and database health cannot be production-ready.

Mitigation: Restore or attach the intended PostgreSQL database, configure `DATABASE_URL`, run `npx prisma migrate deploy`, seed minimal beta data, and require `databaseConfigured=true`.

Risk: Railway R2 runtime variables are missing and uploads still use local filesystem persistence.

Impact: User-uploaded prescription files would not meet the R2 single-source-of-truth requirement.

Mitigation: Configure protected R2 variables and replace `UploadService` local writes with R2 object storage before upload UAT.

Risk: GitHub SSH rejects the current key.

Impact: Local infrastructure commits cannot be pushed to `origin/main`.

Mitigation: Add the workstation public key to the GitHub account with access to `emttspk/dawaisaver.pk`, then rerun `ssh -T git@github.com` and push.

Risk: Railway CLI returns `Unauthorized` once stale env vars are cleared.

Impact: The workspace cannot safely verify variables, Postgres, migrations, or deployment changes.

Mitigation: Obtain a fresh Railway token that can access `dawaisaver.pk`, then re-run `railway whoami` and `railway status`.

## P16 Residual Risk - Missing Production Database Attachment

Risk: `DATABASE_URL` is still absent in the current shell session.

Impact: `npx prisma migrate deploy` cannot be completed locally until the production database URL is attached in the runtime environment.

Mitigation: Attach the Railway Postgres connection string to the API service, then rerun Prisma migrate and seed commands.

## P19 Residual Risk - Manual Cloudflare R2 Values Still Needed

Risk: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_PUBLIC_BASE_URL` are not yet present in the Railway API service.

Impact: The live app upload flow cannot be considered fully production-complete until the manual Cloudflare dashboard values are attached and the production upload path is re-run.

Mitigation: Source `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` from Cloudflare Dashboard > R2 > Manage R2 API Tokens, source `R2_PUBLIC_BASE_URL` from the `dawaisaver-pk` bucket settings, then rerun the upload UAT flow.
