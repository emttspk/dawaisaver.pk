# Project Risks

## High Risks

- Medicine equivalence can be unsafe if composition equivalence is confused with clinical substitution.
- External data sources may be incomplete, inconsistent, stale, or legally restricted.
- User prescriptions and bills contain sensitive personal data.
- Price data can become stale quickly.

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

## Current Residual Risk

The database foundation is documented and modeled, but it has not been applied to a live PostgreSQL database yet.

