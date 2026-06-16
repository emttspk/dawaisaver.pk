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
