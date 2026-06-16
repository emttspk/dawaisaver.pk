# Project Decisions

## 2026-06-15: Treat DawaiSaver.pk As Medicine Intelligence Platform

Decision: The product architecture is centered on intelligence, normalization, equivalence, price observation, review workflows, and source attribution.

Reason: The user explicitly stated this is not a pharmacy website clone.

## 2026-06-15: Phase 0 Before Code

Decision: Create governance and recovery documentation before implementing application code.

Reason: The user marked Phase 0 as mandatory first step.

## 2026-06-15: Preserve Historical Records

Decision: Price observations, source records, crawl outputs, and audit events should be append-only wherever possible.

Reason: The user required historical records to never be overwritten.

## 2026-06-15: Use Reviewable Confidence-Based Intelligence

Decision: Matching, normalization, recommendations, and unknown product discovery must produce confidence scores and support admin review.

Reason: Medical and price intelligence must be explainable and safe.

## 2026-06-15: Keep Health Module Under Runtime Modules

Decision: Place the health module at `src/modules/health/` so it matches the backend runtime layout and is easy to discover alongside other application modules.

Reason: The runtime foundation should follow the same modular organization as the domain engines.

## 2026-06-15: Keep Public APIs Under `/api`

Decision: Expose the controller layer under the `/api` prefix and serve Swagger at `/api/docs`.

Reason: The user requested `/api/...` endpoints, and keeping the prefix stable reduces confusion for future controllers.

## 2026-06-15: Standardize API Envelopes

Decision: Wrap successful and failed API responses in a stable envelope format.

Reason: The controller layer needs predictable JSON contracts for client development and future versioning.

## 2026-06-15: Use A Mock OCR Abstraction First

Decision: Build an OCR abstraction with a mock provider before integrating a real OCR vendor.

Reason: The user requested OCR abstraction only for the prescription pipeline, and the runtime should remain provider-agnostic until a vendor is selected.

## 2026-06-15: Use Safety Wording For Medicine Comparisons

Decision: Prescription alternatives should be described as "Equivalent options with same active ingredient, strength, and dosage form."

Reason: The pipeline must avoid implying unsupported clinical substitution language.

## 2026-06-15: Build Pluggable OCR Provider Architecture

Decision: Implement OCR with a pluggable provider architecture supporting Google Vision, Tesseract, and Mock providers with priority-based fallback.

Reason: The user requested replaceable mock OCR with provider abstraction for future vendor integration, and a priority-based approach ensures the best available provider is used automatically.

## 2026-06-16: Cloudflare R2 as Single Source of Truth

Decision: All persistent file storage must use Cloudflare R2. Railway filesystem, Docker filesystem, and worker local storage are temporary only. PostgreSQL stores metadata only.

Reason: Data persistence and consistency requirements for production deployment.

## 2026-06-16: Block Production Deployment On Project Identity

Decision: Do not run Railway variables, migrations, or deployment commands while `railway status` resolves to any project other than `dawaisaver.pk` (`e38bb3da-7ab5-4654-b504-101e74c92d5b`).

Reason: Protected Scope Protocol applies to production variables, deployment configuration, database migrations, R2 configuration, and authentication.

## 2026-06-16: Use Minimal Seed Data For Closed Beta

Decision: Seed only a tiny medicine/manufacturer/generic/alternative dataset for closed beta verification until audited DRAP/import data is available.

Reason: Beta launch needs searchable and reviewable records without overstating corpus completeness.

## 2026-06-16: Keep API Observable Without Database

Decision: The Railway healthcheck uses `/health/application`, while `/health` and `/health/database` continue to expose degraded database status until `DATABASE_URL` is restored.

Reason: The API process should remain observable during infrastructure repair, but database readiness must not be falsely reported as healthy.

## 2026-06-16: Do Not Generate Public Railway Domain During Audit

Decision: Do not run `railway domain` during infrastructure audit.

Reason: The command can create a new public endpoint, which is a production-scope mutation not needed for database or R2 verification.

## 2026-06-16: Protect Secret Values In Reports

Decision: Presence checks may be documented, but raw `DATABASE_URL`, JWT secrets, and R2 credentials must not be printed or committed.

Reason: The infrastructure completion phase touches production credentials and must preserve secret hygiene.

## 2026-06-16: Treat GitHub SSH And Railway Tokens As Access Prerequisites

Decision: Do not continue production mutation work until the GitHub SSH key is added to the `emttspk` account and Railway is re-authenticated with a valid token.

Reason: Variables, Postgres, migrations, and deploys are all gated by those two credential paths.

## 2026-06-16: Route Uploads Through R2 Only

Decision: The OCR upload service must write to Cloudflare R2 via signed object requests and must not use the local filesystem for persistent uploads.

Reason: The production storage model requires R2 as the single source of truth for uploaded files, OCR artifacts, and image payloads.

## 2026-06-16: Keep R2 Upload Verification Local When Railway Is Unavailable

Decision: Verify the R2 upload path with local tests and build checks when the live Railway environment is not available for mutation.

Reason: The upload code path can still be validated in repo without printing or exposing protected credentials.
